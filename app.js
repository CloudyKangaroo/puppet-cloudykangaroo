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
  redisClient.set("foo_rand000000000000", "Redis Connectivity Test Complete");
  redisClient.get("foo_rand000000000000", redis.print);
});

var ud = require('./lib/uberdata')(config.redis.port, config.redis.host, UberAuth);

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
app.set('puppetdb_uri', 'http://' + config.puppetdb.host + ':' + config.puppetdb.port + '/v3');
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

app.locals.getFormattedISO8601 = function (timeStamp, dateString) {
  if (arguments.length == 1) {
    var dateString = 'MMM DD H:mm:ss';
  }
  var offset = moment(timeStamp);
  return offset.format(dateString);
}

app.locals.getCombinedDevices = function () {
  var url = app.get('puppetdb_uri') + '/nodes?query=["=", ["fact", "kernel"], "Linux"]';
  var async = require('async');
  var request = require('request')

  request({ url: url, json: true }
    , function (error, response, body) {
        if (error) {
          console.log(error);
          res.send(500);
        } else {
          var nodes = body;
          var aReturn = Array();
          var aSyncRequests = Array();
          var foundSome = false;

          aSyncRequests.push(
            function (callback) {
              var url = app.get('sensu_uri') + '/clients/';
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
                  for(i = 0; i<results.length; i++)
                  {
                    console.log(results[i]);
                  }
                  return JSON.stringify(results);
                }
            }
          );
        }
    }
  );
}

require("./routes")(app, config, passport, redisClient);

http.createServer(app).listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});
