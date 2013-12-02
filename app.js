
/**
 * Module dependencies.
 */

require('./crowd-credentials.js');
var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var flash = require('connect-flash');
var _ = require('underscore');
var passport = require('passport');
var AtlassianCrowdStrategy = require('passport-atlassian-crowd').Strategy;

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
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);

/*
 User Account Routes
 */
app.put('/account/*', ensureAuthenticated);
app.get('/account', function (req, res) {
  res.render('account', { user:req.user });
});

app.get('/login', function (req, res) {
  res.render('login', { user:req.user, message:req.flash('error') });
});

app.post('/login',
  passport.authenticate('atlassian-crowd', { failureRedirect:'/login', failureFlash:"Invalid username or password."}),
  function (req, res) {
    res.redirect('/account');
  });

app.get('/logout', function (req, res) {
  req.logout();
  res.redirect('/');
});

/*
  Monitoring System Routes (the meat of the app)
 */
app.put('/monitoring/*', requireGroup('Engineers'));
app.get('/monitoring', function (req, res) {
  res.render('monitoring', { user:req.user });
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
  }
  res.redirect('/login')
}

function requireGroup(group) {
  return function(req, res, next) {
    if (req.isAuthenticated() && req.user && req.user.groups.indexOf(group) > -1)
      next();
    else
      res.send(401, 'Unauthorized');
  }
};