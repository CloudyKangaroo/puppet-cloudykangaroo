/**
 * Application Dependencies
 */

require('./config/system-credentials.js');

var config = require('./config');

require('enum').register();
var redis = require('redis');
var express = require('express');
var http = require('http');
var path = require('path');
var flash = require('connect-flash');
var _ = require('underscore');

var passport = require('passport');
var AtlassianCrowdStrategy = require('passport-atlassian-crowd').Strategy;

//var formidable = require('formidable');
var redisClient = redis.createClient(config.redis.port, config.redis.host);
var fs = require('fs');
var logstream = fs.createWriteStream(config.log.access_log, {flags: 'a'});

redisClient.on('error', function (error) {
  console.log(error)
});
redisClient.on("connect", function () {
  redisClient.set("foo_rand000000000000", "Redis Connect Test: OK", redis.print);
  redisClient.get("foo_rand000000000000", redis.print);
});

/**
 * Ubersmith Integration
 */
var ubersmith = require('ubersmith');

ubersmith.uberAuth = UberAuth;

populateUberData('support.ticket_count', '&priority=0&type=ClientAll', 'support.ticket_count.low');
populateUberData('support.ticket_count', '&priority=1&type=ClientAll', 'support.ticket_count.normal');
populateUberData('support.ticket_count', '&priority=2&type=ClientAll', 'support.ticket_count.high');
populateUberData('support.ticket_count', '&priority=3&type=ClientAll', 'support.ticket_count.urgent');
populateUberData('support.ticket_count', '&type=ClientAll', 'support.ticket_count.total');

populateUberData('client.list');
populateUberData('device.list', '', 'device.list', '30');
populateUberData('device.type_list');
populateUberData('event_list');
populateUberData('support.ticket_list', '', 'support.ticket_list', '60');
populateUberData('support.ticket_count', '', 'support.ticket_count', '60');

function populateUberData(method, params, key, interval) {
  if (arguments.length == 1) {
    var params = '';
    var key = method;
    var interval = 300;
  }

  if (arguments.length == 2) {
    var key = method;
    var interval = 300;
  }

  if (arguments.length == 3) {
    var interval = 300;
  }

  ubersmith.uberRefreshData(method, params, key);
  ubersmith.uberScheduleRefresh(method, interval, params, key);
  ubersmith.on('ready.' + key, function (body, key) {
    storeUberData(body, key)
  });
  ubersmith.on('failed.' + key, function (err) {
    uberError(err)
  });
}
function uberError(err) {
  console.log(err);
}
function storeUberData(body, key) {
  console.log('Storing ' + JSON.stringify(body.data).length + ' bytes as ' + key);
//  redisClient.del(key);
  redisClient.set(key, JSON.stringify(body.data));
}

/**
 * End Ubersmith
 */

/**
 * Metrics Objects
 */

var metrics = require('measured');
var collection = new metrics.Collection('http');
var rps = collection.meter('requestsPerSecond')

/**
 * Authentication System
 */

var users = [];

// passport-attlassian-crowd from : https://bitbucket.org/knecht_andreas/passport-atlassian-crowd
// MIT License

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.

passport.serializeUser(function (user, done) {
  done(null, user.username);
});

passport.deserializeUser(function (username, done) {
  var user = _.find(users, function (user) {
    return user.username == username;
  });
  if (user === undefined) {
    done(new Error("No user with username '" + username + "' found."));
  } else {
    done(null, user);
  }
});

// Use the AtlassianCrowdStrategy within Passport.
//   Strategies in passport require a `verify` function, which accept
//   credentials (in this case a crowd user profile), and invoke a callback
//   with a user object.

passport.use(new AtlassianCrowdStrategy({
    crowdServer: CrowdAuth['server'],
    crowdApplication: CrowdAuth['application'],
    crowdApplicationPassword: CrowdAuth['password'],
    retrieveGroupMemberships: true
  },
  function (userprofile, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {

      var exists = _.any(users, function (user) {
        return user.id == userprofile.id;
      });

      if (!exists) {
        users.push(userprofile);
      }

      return done(null, userprofile);
    });
  }
));

/**
 * The Start of the Application Logic
 */

var app = express();

// all environments
app.set('port', config.http.port || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.set('sensu_uri', 'http://' + config.sensu.host + ':' + config.sensu.port);
app.locals.moment = require('moment');
app.use(express.logger({stream: logstream }));
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser(config.cookie.secret));
app.use(express.session());
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
app.use(rpsMeter);
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

/*
 * Metrics Middleware
 *  Called by app.use(rpsMeter);
 *  This adds the RPS metric, we are using this
 *  middleware so that every request is counted.
 */
function rpsMeter(req, res, next) {
  rps.mark();
  next();
}
/**
 * End Metrics
 */

/**
 * Development Environment Code
 */
if ('development' == app.get('env')) {
  // Use the express errorHandler
  app.use(express.errorHandler());
}

app.locals.ensureAuthenticated = function (req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.render('account/login', { user: req.user, message: req.flash('error') });
  }
}
app.locals.ensureAPIAuthenticated = function (req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.send(403);
  }
}
app.locals.requireGroup = function (group) {
  return function (req, res, next) {
    if (req.isAuthenticated() && req.user && req.user.groups.indexOf(group) > -1) {
      next();
    } else {
      console.log('User: ' + req.user + ' is not a member of ' + group);
      res.render('account/login', { user: req.user, message: req.flash('error') });
    }
  }
};
app.locals.getEventClass = function (eventStatus) {
  var StatusEnum = new Enum({'warning': 1, 'danger': 2, 'success': 0});
  var eventClass = StatusEnum.get(eventStatus);
  return eventClass;
}
app.locals.getFormattedTimestamp = function (timeStamp, dateString) {
  if (arguments.length == 1) {
    var dateString = 'MMM DD H:mm:ss';
  }
  var offset = moment(timeStamp * 1000);
  return offset.format(dateString);
}

require("./routes")(app, config, passport, redisClient);

http.createServer(app).listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});
