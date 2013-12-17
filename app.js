
/**
 * Application Dependencies
 */

require('./config/system-credentials.js');

/**
 * Configuration
 */

var config = require('./config');

/**
 * Module dependencies.
 */
require('enum').register();
var redis = require('redis');
var express = require('express');
var http = require('http');
var path = require('path');
var flash = require('connect-flash');
var _ = require('underscore');
var passport = require('passport');
var AtlassianCrowdStrategy = require('passport-atlassian-crowd').Strategy;
var request = require('request')
var formidable = require('formidable');
var fs = require('fs');
var logstream = fs.createWriteStream(config.log.access_log, {flags: 'a'});

var redisClient = redis.createClient(config.redis.port, config.redis.host);

redisClient.on('error', function(error) { console.log(error) });
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


function populateUberData(method, params, key, interval)
{
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
  ubersmith.on('ready.' + key, function(body, key) { storeUberData(body, key)});
  ubersmith.on('failed.' + key, function(err) { uberError(err)});
}

function uberError(err)
{
  console.log(err);
}

function storeUberData(body, key)
{
  console.log('Storing ' + JSON.stringify(body.data).length + ' bytes as ' + key);
  redisClient.del(key);
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
    crowdServer:CrowdAuth['server'],
    crowdApplication:CrowdAuth['application'],
    crowdApplicationPassword:CrowdAuth['password'],
    retrieveGroupMemberships:true
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

/**
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
 * Development Enironment Code
 */

if ('development' == app.get('env')) {

  // Log the Metrics Collection to stdout every 15 Seconds
//  setInterval(function() { console.log(collection.toJSON());}, 15000);

  // Use the express errorHandler
  app.use(express.errorHandler());
}

/**
 * Routes for incoming Requests
 *  Used by app.use(app.router);
 */

app.get('/'
  , function (req, res) {
      res.render('index', { user:req.user });
  }
);

/*
 User Account Routes
 */
app.get('/account'
  , ensureAuthenticated
  , function (req, res) {
      res.render('account', { user:req.user, section: 'profile', navLinks: config.navLinks.account });
    }
);

app.get('/account/login'
  , function (req, res) {
      res.render('account/login', { user:req.user, message:req.flash('error'), section: 'logout', navLinks: config.navLinks.account });
  });

app.post('/account/login'
  , passport.authenticate('atlassian-crowd'
  , { failureRedirect:'/account', failureFlash:"Invalid username or password."})
  , function (req, res) {
      backURL=req.header('Referer') || '/account';
      res.redirect(backURL);
  });

app.get('/account/logout'
  , function (req, res) {
      req.logout();
      res.redirect('/');
  });

/*
  Monitoring System Routes
*/

// Ubersmith Overall Status
app.get('/ubersmith'
  , ensureAuthenticated
  , function (req, res) {
    res.render('ubersmith', {ticket_count: { low: redisClient.get('support.ticket_count.low'), normal: redisClient.get('support.ticket_count.normal'), high: redisClient.get('support.ticket_count.high'), urgent: redisClient.get('support.ticket_count.urgent')}, event_list: redisClient.get('uber.event_list'), user:req.user, section: 'dashboard', navLinks: config.navLinks.ubersmith });
  });

// Ubersmith API Passthru
app.get('/ubersmith/data/:key'
    , function (req, res) {
        var key = req.params.key;
        switch(key.toLowerCase())
        {
          case 'support.ticket_count.urgent':
          case 'support.ticket_count.normal':
          case 'support.ticket_count.low':
          case 'support.ticket_count.high':
          case 'support.ticket_count.total':
          case 'event_list':
          case 'device.type_list':
          case 'support.ticket_count':
          case 'support.ticket_list':
          case 'client.list':
          case 'device.list':
            redisClient.get(key.toLowerCase(), function (err, reply) {
              if (!reply) {
                res.send(500);
              } else {
                res.type('application/json');
                res.send(reply);
              }
            });
            break;
          default:
            res.send(400);
            break;
        }
  });

// Device Browser
app.get('/ubersmith/devices'
  , function (req, res) {
    redisClient.get('device.type_list', function (err, reply) {
      console.log(err);
      console.log(reply);
      if (!reply) {
        res.send(500);
      } else {
        var deviceTypeList = JSON.parse(reply);
        res.render('ubersmith/devices', { device_types: deviceTypeList, user:req.user, section: 'devices', navLinks: config.navLinks.ubersmith });
      }
    });
  });

// Used by device browser, returns table data
app.get('/ubersmith/devices/list/:devtype_group_id'
  , function (req, res) {
      var aReturn = Array();
      var foundSome = false;
      var filteredDevice = {};
      redisClient.get('device.list', function (err, reply) {
        if (!reply) {
          res.send(500);
        } else {
          var deviceList = JSON.parse(reply);
          Object.keys(deviceList).forEach(function(device_id) {
            device = deviceList[device_id];
            if (device.devtype_group_id == req.params.devtype_group_id) {
              filteredDevice = Array(device.dev, device.type, device.dev_desc, device.company, device.location, device.device_status);
              aReturn.push(filteredDevice);
              foundSome = true;
            }
          })

          if (foundSome) {
            res.type('application/json');
            res.send(JSON.stringify({ aaData: aReturn }));
          } else {
            res.send(404);
          }
        }
      });
  });

// Not yet used, returns a specific device
app.get('/ubersmith/devices/device/:device_id'
  , function (req, res) {
    var deviceList = redisClient.get('device.list');
    if (!deviceList[req.params.device_id]) {
      res.send(404);
    } else {
      res.type('application/json');
      res.send(JSON.stringify(deviceList[req.params.device_id]));
    }
  });

// Ubersmith Customer Browser
app.get('/ubersmith/clients'
  , function (req, res) {
    res.render('ubersmith/clients', { user:req.user, section: 'devices', navLinks: config.navLinks.ubersmith });
  });

// Used by Customer Browser, returns table data
app.get('/ubersmith/clients/list'
  , function (req, res) {
      var aReturn = Array();
      var foundSome = false;
      var filteredDevice = {};
      redisClient.get('client.list', function (err, reply) {
        if (!reply) {
          res.send(500);
        } else {
          var clientList= JSON.parse(reply);
          Object.keys(clientList).forEach(function(clientid) {
            client = clientList[clientid];
            if (client.company != 'REMOVED') {
              var offset = moment(client.created*1000);
              var created = offset.format('MMM DD H:mm:ss');
              filteredDevice = Array(client.clientid, client.full_name, client.listed_company, client.salesperson, client.acctmgr, created);
              aReturn.push(filteredDevice);
              foundSome = true;
            }
          })
   
          if (foundSome) {
            res.type('application/json');
            res.send(JSON.stringify({ aaData: aReturn }));
          } else {
            res.send(404);
          }
        }
      });
  });

app.post('/ubersmith/event/*'
  , function(req, res){
    var form = new formidable.IncomingForm;
    console.log(req.path);
    form.parse(req, function(err, fields, files){
      if (err) return res.end('You found error');
      console.log(fields);
    });

    form.on('progress', function(bytesReceived, bytesExpected) {
//    console.log(bytesReceived + ' ' + bytesExpected);
    });

    form.on('error', function(err) {
      res.writeHead(200, {'content-type': 'text/plain'});
      res.end('error:\n\n'+util.inspect(err));
    });

    res.writeHead(200, {'content-type': 'text/plain'});
    res.end('complete');
  });

app.get('/monitoring'
  , requireGroup('Engineers')
  , function (req, res) {
      var request = require('request');
      request({ url: app.get('sensu_uri') + '/info', json: true }
        , function (error, response, body) {
            if (!error && response.statusCode == 200) {
              res.render('monitoring', {info: body, user:req.user, section: 'info', navLinks: config.navLinks.monitoring });
            }
        })
  });

app.get('/monitoring/events'
  , requireGroup('Engineers')
  , function (req, res) {
    var request = require('request');
    request({ url: app.get('sensu_uri') + '/events', json: true }, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        res.render('monitoring/events', {events: body, user:req.user, section: 'events', navLinks: config.navLinks.monitoring });
      }
    })
  });

app.get('/monitoring/stashes'
  , requireGroup('Engineers')
  , function (req, res) {
    var request = require('request');
    request({ url: app.get('sensu_uri') + '/stashes', json: true }, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        res.render('monitoring/stashes', {stashes: body, user:req.user, section: 'stashes', navLinks: config.navLinks.monitoring });
      }
    })
  });

app.get('/monitoring/checks'
  , requireGroup('Engineers')
  , function (req, res) {
    var request = require('request');
    request({ url: app.get('sensu_uri') + '/checks', json: true }, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        res.render('monitoring/checks', {checks: body, user:req.user, section: 'checks', navLinks: config.navLinks.monitoring });
      }
    })
  });

app.get('/monitoring/clients'
  , requireGroup('Engineers')
  , function (req, res) {
    var request = require('request');
    request({ url: app.get('sensu_uri') + '/clients', json: true }, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        res.render('monitoring/clients', {clients: body, user:req.user, section: 'clients', navLinks: config.navLinks.monitoring });
      }
    })
  });

app.post('/monitoring/stashes/:server'
  , function (req, res) {
    var request = require('request');
    var expiration = new Date(oldDateObj.getTime() + 30*60000);
    request.post({
      url: app.get('sensu_uri') + '/stashes/silence/' + server,
      body: "{ 'timestamp': " + Date.now() + ", 'expires': " + expiration + " }"
    }, function(error, response, body){
      console.log(body);
    });
  });

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.render('account/login', { user:req.user, message:req.flash('error') });
  }
}

function ensureAPIAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.send(403);
  }
}

function requireGroup(group) {
   return function(req, res, next) {
      if (req.isAuthenticated() && req.user && req.user.groups.indexOf(group) > -1) {
        next();
      } else {
        res.render('account/login', { user:req.user, message:req.flash('error') });
      }
    }
};


app.locals.getEventClass = function(eventStatus){
  var StatusEnum = new Enum({'warning': 1, 'danger': 2, 'success': 0});
  var eventClass = StatusEnum.get(eventStatus);
  return eventClass;
}

app.locals.getFormattedTimestamp = function(timeStamp, dateString){
  if (arguments.length == 1) {
    var dateString = 'MMM DD H:mm:ss';
  }
  var offset = moment(timeStamp*1000);
  return offset.format(dateString);
}
