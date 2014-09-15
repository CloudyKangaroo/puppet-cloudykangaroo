/**
 * Application Dependencies
 */

var config = require('./config');

var userPropertyConfig = { userProperty: 'currentUser' };
var menus = require('./lib/menus')(userPropertyConfig);
var utils = require('./lib/utils');
var express = require('express');
var path = require('path');
var flash = require('connect-flash');
var useragent = require('express-useragent');

/*
 Configuration
 */

if (process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'production') {
  throw new Error(process.env.NODE_ENV +  ' is not a known environment, cannot proceed');
}

config.log = config[process.env.NODE_ENV].log;

var credentials;
credentials = require(config.credentials.class)();

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

// Generic Requirements
var redis = {};

if (config.redis && config.redis.class) {
  redis = require(config.redis.class);
} else {
  throw new Error('redis class not specified REDIS_CLASS environment variable of config.redis.class');
}

if (config.USE_NOCK === 'true') {
  require('./lib/nock')(config, logger);
}

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

  if (config.crmModule && config.crmModule.class) {
    crmModule = require(config.crmModule.class)(crmModuleConfig);
  } else {
    var err = new Error('no crmModule specified in configuration');
    throw err;
  }
}
  catch (e) {

  logger.log('error', 'Could not initialize CRM Module', { error: e.message });
  throw e;
}

/* Load the monitoring module */
try {
  if (config.monModule && config.monModule.class) {
    monModule = require(config.monModule.class)(config, logger, crmModule, redisClient);
  } else {
    var err = new Error('no monModule specified in configuration');
    throw err;
  }

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

var pjson = require('../package.json');

// all environments
app.locals.config = config;
app.locals.logger = logger;
app.locals.crmModule = crmModule;
app.locals.monModule = monModule;
app.locals.appMetrics = appMetrics;
app.locals.puppetModule = puppetModule;
app.locals.title = 'Cloudy Kangaroo';
app.locals.version = pjson.version;
app.locals.addMenuContent = menus.addMenuContent;
app.locals.addMenuItem = menus.addMenuItem;

app.enable('trust proxy');

app.set('title', 'Cloudy Kangaroo');
app.set('port', config.http.port || 3000);
/*jslint nomen: true*/
app.set('views', path.join(__dirname, 'views'));
/*jslint nomen: false*/
app.set('view engine', 'jade');
/*jslint nomen: true*/
app.set('base_config_dir', __dirname + '/config');
app.set('base_lib_dir', __dirname + '/lib');
/*jslint nomen: false*/
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
var oauth2 = require('./lib/oauth2')(app, config, authenticator);
var roleManager = require('./lib/roleManager')(app);
var roleHandler = roleManager.roleHandler;
authenticator.oauth2 = oauth2;
authenticator.roleManager = roleManager;
authenticator.roleHandler = roleHandler;

if (process.env.NODE_ENV === 'test') {
  app.use(authenticator.mockPassport.initialize(userPropertyConfig));
} else {
  app.use(authenticator.passport.initialize(userPropertyConfig));
}

app.use(authenticator.passport.session());

app.use(roleHandler.middleware());
app.use(authenticator);
app.use(oauth2);
app.use(roleManager);
app.use(menus);

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

if (!module.parent) {
  server.listen(app.get('port'), function () {
    "use strict";
    logger.log('info', 'Express server listening on port ' + app.get('port'), {});
    logger.log('silly', 'Route Listing', {routes: app.routes});
  });
}

module.exports = app;
