module.exports = function(app, credentials, config, redisClient) {
  "use strict";
  var passport = require('passport');
  var CrowdAuth = credentials.CrowdAuth();
  var AtlassianCrowdStrategy = require('passport-atlassian-crowd').Strategy;
  var LocalStrategy = require('passport-local').Strategy;
  var BasicStrategy = require('passport-http').BasicStrategy;
  var ClientPasswordStrategy = require('passport-oauth2-client-password').Strategy;
  var BearerStrategy = require('passport-http-bearer').Strategy;
  var login = require('connect-ensure-login');
  var db = require('./db');

  var oauth2 = require('./oauth2')(app, config, passport, login);
  /**
   * Authentication System
   */
  var authenticationStrategy = 'atlassian-crowd';
  var users = [];

  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    authenticationStrategy = 'local';

    passport.serializeUser(function(user, done) {
      done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
      db.users.find(id, function (err, user) {
        done(err, user);
      });
    });

    passport.use(new LocalStrategy(
      function(username, password, done) {
        // asynchronous verification, for effect...
        process.nextTick(function () {
          db.users.findByUsername(username, function(err, user) {
            if (err) { return done(err); }
            if (!user) { return done(null, false, { message: 'Unknown user ' + username }); }
            if (user.password !== password) { return done(null, false, { message: 'Invalid password' }); }
            return done(null, user);
          });
        });
      }
    ));
  } else if (process.env.NODE_ENV === 'production') {
    authenticationStrategy = 'atlassian-crowd';
    passport.serializeUser(function(user, done) {
      var userID;
      try {
        userID = new RegExp('[^/]*$').exec(user.id)||[,null][1];
        redisClient.set("user:"+userID, JSON.stringify(user));
      } catch (e) {
        app.locals.logger.log('error', 'Could not serialize user', {user: user});
        done(new Error('could not serialize user'));
      } finally {
        done(null, userID);
      }
    });

    passport.deserializeUser(function(id, done) {
      redisClient.get("user:"+id, function(err, userJSON) {
        var user;

        if (err) {
          done(err, null);
        } else {
          try {
            user = JSON.parse(userJSON);
          }
          catch (e) {
            app.locals.logger.log('error', 'uncaught exception');
          }
          if (!user) {
            err = new Error('could not find user');
          }
          done(err, user);
        }
      });
    });

// passport-attlassian-crowd from : https://bitbucket.org/knecht_andreas/passport-atlassian-crowd
// MIT License

    passport.use(new AtlassianCrowdStrategy({
        crowdServer: CrowdAuth.server,
        crowdApplication: CrowdAuth.application,
        crowdApplicationPassword: CrowdAuth.password,
        retrieveGroupMemberships: true
      },
      function (userprofile, done) {
        // asynchronous verification, for effect...
        process.nextTick(function () {
          var _ = require('underscore');
          var exists = _.any(users, function (user) {
            return user.id === userprofile.id;
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
        app.locals.crmModule.authenticateUser(username, password, function (err, userData) {
            var _ = require('underscore');

            if (err) {
              return done(err);
            }

            var groups = [];

            if (userData.auth_roles)
            {
              var auth_roles = _.values(userData.auth_roles);
              for (var i=0;i<auth_roles.length; i++)
              {
                groups.push(auth_roles[i].name);
              }
            }

            var user = { id: userData.id, name: userData.name, fullname: userData.fullname, emails: [{value: userData.email}], type: userData.type, groups: groups, profile: userData };
            db.users.addUser(user, function(err, user)
            {
              return done(null, user);
            });
          });
      }
    ));
  } else {
    throw new Error(process.env.NODE_ENV +  ' is not a known environment, cannot proceed');
  }

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
        if (client.clientSecret !== password) { return done(null, false); }
        return done(null, client);
      });
    }
  ));

  passport.use(new ClientPasswordStrategy(
    function(clientId, clientSecret, done) {
      db.clients.findByClientId(clientId, function(err, client) {
        if (err) { return done(err); }
        if (!client) { return done(null, false); }
        if (client.clientSecret !== clientSecret) { return done(null, false); }
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
          if (err) { app.locals.logger.log('error', 'find returned error'); return done(err); }
          if (!user) { app.locals.logger.log('debug', 'find failed to find'); return done(null, false); }
          var info = { scope: '*' };
          done(null, user, info);
        });
      });
    }
  ));

  module.oauth2 = oauth2;
  module.mockPassport = require('./mockPassport');
  module.passport = passport;
  module.login = login;
  module.authenticationStrategy = authenticationStrategy;
  return module;
};
