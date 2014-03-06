/**
 * Application Dependencies
 */

var config = require('./config');
var utils = require('./lib/utils');

if (process.env.NODE_ENV == 'development' || process.env.NODE_ENV == 'test') {
  CrowdAuth = new Array();
  CrowdAuth['server'] = '';
  CrowdAuth['application'] = '';
  CrowdAuth['password'] = '';

  crmAuth = new Array();
  crmAuth['username'] = '';
  crmAuth['password'] = '';
  crmAuth['url'] = ''
  crmAuth['host'] = ''
}

if (process.env.NODE_ENV == 'development') {
  config.log.level = config.development.log.level;
  config.log.screen = config.development.log.screen;
} else if (process.env.NODE_ENV == 'test') {
  config.log.level = 'hide';
  config.log.screen = 'hide';
  config.mgmtDomain = '.unittest.us';
} else {
  config.log.level = config.production.log.level;
  config.log.screen = config.production.log.screen;
  require('./config/system-credentials.js');
}

// Generic Requirements
if (process.env.NODE_ENV == 'test') {
  var redis = require("fakeredis");
} else {
  var redis = require('redis');
}

var express = require('express');
var http = require('http');
var path = require('path');
var flash = require('connect-flash');
var useragent = require('express-useragent');

/*
 Initialize the Logging Framework
 */

// Application Logs
var ctxlog = require('contegix-logger');
var logger = ctxlog('main', config.log.level, config.log.directory, { level: config.log.screen}, {level: config.log.level});
var auditLog = ctxlog('audit', config.log.level, config.log.directory, {level: config.log.screen}, {level: config.log.level});

// Access Logs
var reqLogger = require('express-request-logger');
var fs = require('fs');
var logstream = fs.createWriteStream(config.log.access_log, {flags: 'a'});

/*
  Connect to Redis
 */

var redisClient = redis.createClient(config.redis.port, config.redis.host);

redisClient.on('error', function (error) {
  logger.log('error', 'Redis Connect Error', { error: error });
});

redisClient.on("connect"
  , function () {
    redisClient.select('config.redis.db', function (err, res) {
      var redisTestUUID = require('uuid').v4();
      redisClient.set('test_' + redisTestUUID, redisTestUUID);
      redisClient.get('test_' + redisTestUUID
        , function (error, response) {
            if (error)
            {
              logger.log('error', 'Error retrieving value from Redis during startup test', error);
            } else {
              if (response != redisTestUUID)
              {
                logger.log('error', 'Redis returned the incorrect value for redisTestUUID', { redisTestUUID: redisTestUUID, response: response });
              }
            }
          });
      });
  });

/*
  Kick off the Ubersmith background update, pulls from Ubersmith and stores in Redis
 */

try {
  var crmModuleConfig = {mgmtDomain: config.mgmtDomain, redisPort: config.redis.port, redisHost: config.redis.host, redisDb: config.redis.db, uberAuth: crmAuth, logLevel: config.log.level, logDir: config.log.directory, warm_cache: config.crmModule.warm_cache};
  if (process.env.NODE_ENV == 'development' || process.env.NODE_ENV == 'test')
  {
    var crmModule = require('cloudy-localsmith')(crmModuleConfig);
  } else {
    var crmModule = require('cloudy-ubersmith')(crmModuleConfig);
  }
} catch (e) {
  logger.log('error', 'Could not initialize CRM Module', { error: e.message });
  throw e;
}

try {
  var monModule = require('./lib/monitoring')(config, logger, crmModule, redisClient);
} catch (e) {
  logger.log('error', 'Could not initialize Monitoring Module', { error: e.message});
  throw e;
}

/*
Metrics
 */
var metrics = require('measured');
var collection = new metrics.Collection('http');
var rps = collection.meter('requestsPerSecond');
var timer = collection.timer('requestTime');

/*
 Periodically output metrics to the log file
 */
/*
setInterval(function() {
  var metricslogger = ctxlog('metrics', 'debug', config.log.directory, {level: 'error'});
  var collectionJSON = collection.toJSON();
  metricslogger.log('data', 'metrics output', { collection: collectionJSON, type: 'metrics'});
}, config.metrics.interval || 15000);
*/

/**
 * The Start of the Application Logic
 */

var app = express();

// all environments

var RedisStore = require('connect-redis')(express);
app.locals.collection = collection;
app.locals.rps = rps;
app.locals.timer = timer;
app.locals.config = config;
app.locals.logger = logger;
app.locals.audit = auditLog;
app.locals.redisClient = redisClient;
app.locals.moment = require('moment');
app.locals.crmModule = crmModule;
app.locals.monModule = monModule;

app.locals.title = 'Cloudy Kangaroo';
app.enable('trust proxy');

app.set('title', 'Cloudy Kangaroo');
app.set('port', config.http.port || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(function(req, res, next) {
  app.locals.pretty = true;
  next();
});
app.set('sensu_uri', config.sensu.uri);
app.set('puppetdb_uri', config.puppetdb.uri);

app.use(reqLogger.create(logger));
app.use(express.logger({stream: logstream }));

// Compress response data with gzip / deflate.
app.use(express.compress());
app.use(express.favicon());

// http://www.senchalabs.org/connect/json.html
// Parse JSON request bodies, providing the parsed object as req.body.
// MIT https://github.com/senchalabs/connect/blob/master/LICENSE
app.use(express.json({strict: false}));
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(require('connect-requestid'));
app.use(useragent.express());

/*
 Initialize the session and prepare user authentication
 */

app.use(express.cookieParser(config.cookie.secret));
app.use(express.session({
  store: new RedisStore({
    host: config.redis.host,
    port: config.redis.port
  }),
  secret: config.cookie.secret
}));

app.use(flash());

var authenticator = require('./lib/auth')(app, config);
if (process.env.NODE_ENV == 'test') {
  app.use(authenticator.mockPassport.initialize());
} else {
  app.use(authenticator.passport.initialize());
}
app.use(authenticator.passport.session());

/*
   Route requests through the metrics and logging processing
 */
app.use(reqWrapper);

/*
  Pass the requests through the routes
 */

app.use(app.router);

/*
  Last chance, perhaps it is a static resource, most of this offloaded to Nginx
 */
app.use(express.static(path.join(__dirname, 'public')));

/*
 * Metrics Middleware
 *  Called by app.use(rpsMeter);
 *  This adds the RPS metric, we are using this
 *  middleware so that every request is counted.
 */

function reqWrapper(req, res, next) {

  // Perform some work at the beginning of every request

  rps.mark();

  // Generate csrf Token
//  res.locals.token = req.csrfToken();
  res.locals.token = require('uuid').v4();

  logger.req = req;

  // To track response time
  req._rlStartTime = new Date();

  var stopwatch = timer.start();

  req.on('end', function() {
    logger.log('debug', 'ending request', {});
    stopwatch.end();
  });

  req.on('error', function(err) {
    logger.log('error', 'Error in Express Request', { error: err });
  });

  // Save the real end that we will wrap
  // http://stackoverflow.com/questions/8719626/adding-a-hook-to-globally-log-all-node-http-responses-in-node-js-express
  // MIT License https://github.com/mathrawka/express-request-logger/blob/master/LICENSE

  var rEnd = res.end;

  // The following function will be executed when we send our response:
  res.end = function(chunk, encoding) {

    // Do the work expected
    res.end = rEnd;
    res.end(chunk, encoding);

    // And do the work we want now (logging!)
    req.kvLog.status = res.statusCode;
    req.kvLog.response_time = (new Date() - req._rlStartTime);
    req.kvLog.originalURL = req.originalURL || req.url;
    req.kvLog.referer = (req.referer)?req.referer:'none';
    req.kvLog.remoteAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    req.kvLog.userAgent = req.useragent.source;
    req.kvLog.isBot = req.useragent.isBot;
    req.kvLog.OS = req.useragent.OS;
    req.kvLog.Browser = req.useragent.Browser;
    req.kvLog.Platform = req.useragent.Platform;
    req.kvLog.isMobile = req.useragent.isMobile;
    req.kvLog.isDesktop = req.useragent.isDesktop;

    var level = req.kvLog._rlLevel;
    delete req.kvLog._rlLevel;

    var entry = {};
    Object.keys(req.kvLog).forEach(function(key) {
      value = req.kvLog[key];
      if (key !== 'date')
      {
        entry[key] = value;
      }
    });

    logger.log('data', 'request analytics', entry);
  };

  next();
}

/**
 * End Metrics
 */

/**
 * Development Environment Code
 */
app.configure('development', function(){
  app.use(express.errorHandler());
});

app.locals.getFormattedTimestamp = utils.getFormattedTimestamp;
app.locals.getFormattedISO8601 = utils.getFormattedISO8601;

app.locals.getCombinedDevices = function () {
  var url = app.get('puppetdb_uri') + '/nodes?query=["=", ["fact", "kernel"], "Linux"]';
  var async = require('async');
  var request = require('request')

  request({ url: url, json: true }
    , function (error, response, body) {
        if (error) {
          console.error(error);
          res.send(500);
        } else {
          var nodes = body;
          var aReturn = Array();
          var aSyncRequests = Array();
          var foundSome = false;

          aSyncRequests.push(
            function (callback) {
              var url = config.sensu.uri + '/clients/';
              request({ url: url, json: true }
                , function (error, response) {
                    callback(error, response);
                }
              );
            }
          );

          aSyncRequests.push(
            function (callback) {
              redisClient.get('device.list'
                , function (error, response) {
                    callback(error, response);
                }
              );
            }
          );

          for(i = 0; i<nodes.length; i++) {
            var node = nodes[i];
            aSyncRequests.push(
              function (callback) {
                request({ url: app.get('puppetdb_uri') + '/nodes/' + node.name + '/facts', json: true}
                  , function (error, response, body) {
                      if (error) {
                        callback(error, response);
                      } else {
                        var facts = body;
                        var nodeFacts = { hostname: node.name, node: node, facts: body };
                        callback(error, nodeFacts);
                      }
                    }
                );
              }
            );
          }

          async.parallel(aSyncRequests
            , function(error, results) {
                if (error) {
                  console.log(error);
                res.send(500);
                } else {
                  return JSON.stringify(results);
                }
            }
          );
        }
    }
  );
}

app.locals.getPuppetDevice = function(hostname, getDevCallback) {
  var async = require('async');
  redisClient.get('puppet:devices:' + hostname, function (err, reply) {
    if (!err && reply)
    {
      logger.log('debug', 'got device from Redis');
      try {
       var parsedJSON = JSON.parse(reply)
      }
      catch (e) {
          logger.log('error', 'uncaught exception', { err: e});
      }
      getDevCallback(null, parsedJSON);
    } else {
      logger.log('debug', 'getting device from puppet');
      async.parallel([
        function (asyncCallback) {
          var request = require('request');
          var url = app.get('puppetdb_uri') + '/nodes/' + hostname;
          request({ url: url, json: true }
            , function (error, response) {
              logger.log('verbose', 'response from puppet', {body: response.body, url: url});
              asyncCallback(error, response.body);
            });
        },
        function (asyncCallback) {
          var request = require('request');
          var url = app.get('puppetdb_uri') + '/nodes/' + hostname + '/facts';
          request({ url: url, json: true }
            , function (error, response) {
              logger.log('verbose', 'response from puppet', {body: response.body, url: url});
              asyncCallback(error, response.body);
            });
        }
      ], function(err, results) {
        if (err)
        {
          getDevCallback(err);
        } else {
          if (results && results.length==2)
          {
            if (results[0].error)
            {
              var node = { name: hostname,
                deactivated: null,
                catalog_timestamp: '2014-01-22T04:11:05.562Z',
                facts_timestamp: '2014-01-22T04:10:58.232Z',
                report_timestamp: '2014-01-22T04:11:04.076Z' };
              var puppetDevice = {error: results[0].error, node: node, facts: []};
            } else {
              var facts = results[1];
              var factInfo = {};
              for (i=0; i<facts.length; i++)
              {
                var fact = facts[i];
                factInfo[fact.name] = fact.value;
              }
              var puppetDevice = {node: results[0], facts: factInfo, factsArray: facts};
            }
            redisClient.set('puppet:devices:' + hostname, JSON.stringify(puppetDevice));
            redisClient.expire('puppet:devices:' + hostname, 30)
            getDevCallback(err, puppetDevice);
          } else {
            getDevCallback(new Error('could not retrieve host and facts from Puppet'));
          }
        }
      });
    }
  });
}

app.locals.dumpError = function (err, loggerObj)
{
  if (typeof err === 'object') {
    loggerObj.log('error', err.message, { message: JSON.stringify(err.message), stack: JSON.stringify(err.stack)});
  } else {
    loggerObj.log('error', 'dumpError :: argument is not an object', {err: JSON.stringify(err)});
  }
}

app.locals.parseRedisSet = function (redisSet)
{
  var retItems = new Array();
  for (i=0; i<=redisSet.length;i++)
  {
    if (redisSet[i] != 'undefined')
    {
      try {
        var item = redisSet[i];
        retItems.push(JSON.parse(item));
      } catch (e) {
        app.locals.logger.log('debug', 'Tried to parse invalid JSON: "' + e.message + '"', { json: redisSet[i]});
      }
    }
  }
  return retItems;
}

require("./routes")(app, config, authenticator, redisClient);
var server = require('http').createServer(app);
var socketsIO = require('./lib/sockets.io')(app, config, server);

if (!module.parent) {
  server.listen(app.get('port'), function () {
    logger.log('info', 'Express server listening on port ' + app.get('port'), {});
    logger.log('silly', 'Route Listing', {routes: app.routes});
  });
};

module.exports = app;
