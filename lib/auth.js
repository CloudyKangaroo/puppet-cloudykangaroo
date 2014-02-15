module.exports = function(app, config) {
  var passport = require('passport')
    , AtlassianCrowdStrategy = require('passport-atlassian-crowd').Strategy
    , LocalStrategy = require('passport-local').Strategy
    , BasicStrategy = require('passport-http').BasicStrategy
    , ClientPasswordStrategy = require('passport-oauth2-client-password').Strategy
    , BearerStrategy = require('passport-http-bearer').Strategy
    , login = require('connect-ensure-login');

  var oauth2 = require('./oauth2')(app, config, passport, login);
  /**
   * Authentication System
   */

  var users = [];

  passport.serializeUser(function(user, done) {
    var userId = RegExp('[^/]*$').exec(user.id)||[,null][1];
    redisClient.set("user:"+userId, JSON.stringify(user));
    done(null, userId);
  });

  passport.deserializeUser(function(id, done) {
    redisClient.get("user:"+id, function(err, data) {
      try {
        var parsedJSON = JSON.parse(data);
      }
      catch (e) {
        app.locals.app.locals.logger.log('error', 'uncaught exception');
      }
      var user = parsedJSON;
      done(null, user);
    });
  });

// passport-attlassian-crowd from : https://bitbucket.org/knecht_andreas/passport-atlassian-crowd
// MIT License

  passport.use(new AtlassianCrowdStrategy({
      crowdServer: CrowdAuth['server'],
      crowdApplication: CrowdAuth['application'],
      crowdApplicationPassword: CrowdAuth['password'],
      retrieveGroupMemberships: true
    },
    function (userprofile, done) {
      // asynchronous verification, for effect...
      process.nextTick(function () {
        var _ = require('underscore');
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
   * LocalStrategy
   *
   * This strategy is used to authenticate users based on a username and password.
   * Anytime a request is made to authorize an application, we must ensure that
   * a user is logged in before asking them to approve the request.
   */

  /*
   Authenticate users against Ubersmith
   */
  passport.use(new LocalStrategy(
    function(username, password, done) {
      ubersmith.authenticateUser(username, password, function (err, userData) {
        if (err) {
          return done(err);
        }
        var user = { id: userData.id, name: userData.fullname, password: password, profile: userData };
        console.log(user);
        return done(null, user);
      });
      /*
       db.users.findByUsername(username, function(err, user) {
       if (err) { return done(err); }
       if (!user) { return done(null, false); }
       if (user.password != password) { return done(null, false); }
       return done(null, user);
       });
       */
    }
  ));


  /**
   * BasicStrategy & ClientPasswordStrategy
   *
   * These strategies are used to authenticate registered OAuth clients.  They are
   * employed to protect the `token` endpoint, which consumers use to obtain
   * access tokens.  The OAuth 2.0 specification suggests that clients use the
   * HTTP Basic scheme to authenticate.  Use of the client password strategy
   * allows clients to send the same credentials in the request body (as opposed
   * to the `Authorization` header).  While this approach is not recommended by
   * the specification, in practice it is quite common.
   */
  passport.use(new BasicStrategy(
    function(username, password, done) {
      db.clients.findByClientId(username, function(err, client) {
        if (err) { return done(err); }
        if (!client) { return done(null, false); }
        if (client.clientSecret != password) { return done(null, false); }
        return done(null, client);
      });
    }
  ));

  passport.use(new ClientPasswordStrategy(
    function(clientId, clientSecret, done) {
      db.clients.findByClientId(clientId, function(err, client) {
        if (err) { return done(err); }
        if (!client) { return done(null, false); }
        if (client.clientSecret != clientSecret) { return done(null, false); }
        return done(null, client);
      });
    }
  ));

  /**
   * BearerStrategy
   *
   * This strategy is used to authenticate users based on an access token (aka a
   * bearer token).  The user must have previously authorized a client
   * application, which is issued an access token to make requests on behalf of
   * the authorizing user.
   */
  passport.use(new BearerStrategy(
    function(accessToken, done) {
      db.accessTokens.find(accessToken, function(err, token) {
        if (err) { return done(err); }
        if (!token) { return done(null, false); }

        db.users.find(token.userID, function(err, user) {
          if (err) { return done(err); }
          if (!user) { return done(null, false); }
          // to keep this example simple, restricted scopes are not implemented,
          // and this is just for illustrative purposes
          var info = { scope: '*' }
          done(null, user, info);
        });
      });
    }
  ));

  module.oauth2 = oauth2;
  module.passport = passport;
  module.login = login;
  return module;
}
