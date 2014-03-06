/**
 * Application Dependencies
 */

var config = require('./config');
var utils = require('./lib/utils');
var express = require('express');
var path = require('path');
var flash = require('connect-flash');
var useragent = require('express-useragent');

/*
Configuration
 */
var credentials;

if (process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test') {
  config.log.level = config.production.log.level;
  config.log.screen = config.production.log.screen;
  credentials = require('./config/system-credentials')();
} else if (process.env.NODE_ENV === 'development') {
  credentials = require('./config/system-dev-credentials')();
  config.log.level = config.development.log.level;
  config.log.screen = config.development.log.screen;
} else if (process.env.NODE_ENV === 'test') {
  credentials = require('./config/system-dev-credentials')();
  config.log.level = 'hide';
  config.log.screen = 'hide';
  config.mgmtDomain = '.unittest.us';
} else {
  throw new Error(process.env.NODE_ENV +  ' is not a known environment, cannot proceed');
}

// Generic Requirements
var redis = {};

if (process.env.NODE_ENV === 'test') {
  redis = require("fakeredis");
} else {
  redis = require('redis');
}

if (process.env.NODE_ENV === 'test') {
  require('./lib/nock')(config, logger);
}

/*
 Initialize the Logging Framework
 */

// Application Logs
var ctxlog = require('contegix-logger');
var logger = ctxlog('main', config.log.level, config.log.directory, { level: config.log.screen}, {level: config.log.level});

// Access Logs
var reqLogger = require('express-request-logger');
var fs = require('fs');
var logstream = fs.createWriteStream(config.log.accessLog, {flags: 'a'});

/* Connect to Redis */
var redisClient = redis.createClient(config.redis.port, config.redis.host);

redisClient.on('error', function (error) {
  "use strict";
  logger.log('error', 'Redis Connect Error: ' + error.message, { error: error });
});

redisClient.on("connect", function () {
  "use strict";
  redisClient.select(config.redis.db, function (error, response) {
    if (error) { throw error; }

    if (response !== 'OK') {
      logger.log('warn', 'Unexpected response on Redis Connect', {response: response});
    }

    var redisTestUID = utils.uid(16);
    redisClient.set('test_' + redisTestUID, redisTestUID);
    redisClient.get('test_' + redisTestUID, function (error, response) {
      if (error)
      {
        logger.log('error', 'Error retrieving value from Redis during startup test', error);
      } else {
        if (response !== redisTestUID)
        {
          logger.log('error', 'Redis returned the incorrect value for redisTestUID', {
            redisTestUID: redisTestUID,
            response: response
          });
        }
      }
    });
  });
});

var crmAuth = credentials.crmAuth();

/* Kick off the Ubersmith background update, pulls from Ubersmith and stores in Redis */
try {
  var crmModuleConfig = {
    mgmtDomain: config.mgmtDomain,
    redisPort: config.redis.port,
    redisHost: config.redis.host,
    redisDb: config.redis.db,
    uberAuth: crmAuth,
    logLevel: config.log.level,
    logDir: config.log.directory,
    warm_cache: config.crmModule.warmCache
  };

  var crmModule = {};

  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test')
  {
    crmModule = require('cloudy-localsmith')(crmModuleConfig);
  } else {
    crmModule = require('cloudy-ubersmith')(crmModuleConfig);
  }
}
  catch (e) {

  logger.log('error', 'Could not initialize CRM Module', { error: e.message });
  throw e;
}

/* Load the monitoring module */
try {
  var monModule = require('./lib/monitoring')(config, logger, crmModule, redisClient);
} catch (e) {
  logger.log('error', 'Could not initialize Monitoring Module', { error: e.message});
  throw e;
}

/* Load the puppet module */
try {
  var puppetModule = require('./lib/puppet')(config, logger, redisClient);
} catch (e) {
  logger.log('error', 'Could not initialize PuppetDB Module', { error: e.message});
  throw e;
}

/* Load the application metrics module */
try {
  var appMetrics = require('./lib/metrics')(logger, config);
} catch (e) {
  logger.log('error', 'Could not initialize appMetrics Module', { error: e.message});
  throw e;
}

/**
 * The Start of the Application Logic
 */

var app = express();

// all environments
app.locals.config = config;
app.locals.logger = logger;
app.locals.crmModule = crmModule;
app.locals.monModule = monModule;
app.locals.appMetrics = appMetrics;
app.locals.puppetModule = puppetModule;
app.locals.title = 'Cloudy Kangaroo';

app.enable('trust proxy');

app.set('title', 'Cloudy Kangaroo');
app.set('port', config.http.port || 3000);
/*jslint nomen: true*/
app.set('views', path.join(__dirname, 'views'));
/*jslint nomen: false*/
app.set('view engine', 'jade');
app.set('sensu_uri', config.sensu.uri);
app.set('puppetdb_uri', config.puppetdb.uri);
app.use(express.bodyParser());
app.use(reqLogger.create(logger));
app.use(express.logger({stream: logstream }));
app.use(express.compress());
app.use(express.favicon());
app.use(express.json({strict: false}));
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(require('connect-requestid'));
app.use(useragent.express());

/*
 Initialize the session and prepare user authentication
 */

app.use(express.cookieParser(config.cookie.secret));
var session = require('express-session') , RedisStore = require('connect-redis')(session);

app.use(express.session({
  store: new RedisStore({
    host: config.redis.host,
    port: config.redis.port
  }),
  secret: config.cookie.secret
}));

app.use(flash());

var authenticator = require('./lib/auth')(app, credentials, config, redisClient);

if (process.env.NODE_ENV === 'test') {
  app.use(authenticator.mockPassport.initialize());
} else {
  app.use(authenticator.passport.initialize());
}

app.use(authenticator.passport.session());

/*
  End User Authentication
 */

/* Route requests through the metrics and logging processing */
app.use(appMetrics.reqWrapper);

/* Pass the requests through the routes */
app.use(app.router);

/* Last chance, perhaps it is a static resource, most of this offloaded to Nginx */
/*jslint nomen: true*/
app.use(express.static(path.join(__dirname, 'public')));
/*jslint nomen: false*/
/* Development Environment Code */
app.configure('development', function () {
  "use strict";
  app.use(express.errorHandler());
  app.locals.pretty = true;
});

require("./routes")(app, config, authenticator, redisClient);

var server = require('http').createServer(app);
require('./lib/sockets.io')(app, config, server);

if (!module.parent) {
  server.listen(app.get('port'), function () {
    "use strict";
    logger.log('info', 'Express server listening on port ' + app.get('port'), {});
    logger.log('silly', 'Route Listing', {routes: app.routes});
  });
}

module.exports = app;
