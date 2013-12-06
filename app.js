/**
 * Module dependencies.
 */

require('./crowd-credentials.js');
require('enum').register();
var config = require('./config');
var express = require('express');
var http = require('http');
var path = require('path');
var flash = require('connect-flash');
var _ = require('underscore');
var passport = require('passport');
var AtlassianCrowdStrategy = require('passport-atlassian-crowd').Strategy;

var metrics    = require('measured');
var collection = new metrics.Collection('http');
var rps = collection.meter('requestsPerSecond')

var users = [];

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
//   with a user object.  In the real world, this would query a database;
//   however, in this example we are using a baked-in set of users.
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


var app = express();

// all environments
app.set('port', config.http.port || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.set('sensu_uri', 'http://' + config.sensu.host + ':' + config.sensu.port);
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
app.locals.moment = require('moment');

/***
 * Metrics Middleware
 ***/

function rpsMeter(req, res, next) {
  rps.mark();
  next();
}

/***
 * End Metrics
 ***/

// development only
if ('development' == app.get('env')) {
  setInterval(function() {
    console.log(collection.toJSON());
  }, 15000);
  app.use(express.errorHandler());
}

app.get('/', function (req, res) {
  res.render('index', { user:req.user });
});

/*
 User Account Routes
 */
app.get('/account', ensureAuthenticated, function (req, res) {
  res.render('account', { user:req.user });
});

app.get('/account/login', function (req, res) {
  res.render('account/login', { user:req.user, message:req.flash('error') });
});

app.post('/account/login',
  passport.authenticate('atlassian-crowd', { failureRedirect:'/account.login', failureFlash:"Invalid username or password."}),
  function (req, res) {
    backURL=req.header('Referer') || '/account';
    res.redirect(backURL);
  });

app.get('/account/logout', function (req, res) {
  req.logout();
  res.redirect('/');
});

/*
  Monitoring System Routes
*/

app.put('/monitoring/*', requireGroup('Engineers'));
app.get('/monitoring', function (req, res) {
  var request = require('request');
  request({ url: app.get('sensu_uri') + '/info', json: true }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      res.render('monitoring', {info: body, user:req.user, section: 'info', navLinks: config.navLinks });
    }
  })
});

/*
app.get('/monitor', function (req, res) {
  var options = {
      host: '192.168.65.102',
      port: 4567,
      path: '/info',
      method: 'GET'
  }
  var req = http.get(options, function(req) {
    var pageData = '';
    req.setEncoding('utf8');

    req.on('data', function (chunk) {
      pageData += chunk;
    });

    req.on('end', function(){
      var info = JSON.parse(pageData)
      res.render('monitoring', {info: info, user:req.user, section: 'info', navLinks: config.navLinks });
    });
  })
});
*/

app.get('/monitoring/events', function (req, res) {
  var request = require('request');
  request({ url: app.get('sensu_uri') + '/events', json: true }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      res.render('monitoring/events', {events: body, user:req.user, section: 'events', navLinks: config.navLinks });
    }
  })
});

app.get('/monitoring/stashes', function (req, res) {
  var request = require('request');
  request({ url: app.get('sensu_uri') + '/stashes', json: true }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      res.render('monitoring/stashes', {stashes: body, user:req.user, section: 'stashes', navLinks: config.navLinks });
    }
  })
});

app.get('/monitoring/checks', function (req, res) {
  var request = require('request');
  request({ url: app.get('sensu_uri') + '/checks', json: true }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      res.render('monitoring/checks', {checks: body, user:req.user, section: 'checks', navLinks: config.navLinks });
    }
  })
});

app.get('/monitoring/clients', function (req, res) {
  var request = require('request');
  request({ url: app.get('sensu_uri') + '/clients', json: true }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      res.render('monitoring/clients', {clients: body, user:req.user, section: 'clients', navLinks: config.navLinks });
    }
  })
});

app.post('/monitoring/stashes/:server', function (req, res) {
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
