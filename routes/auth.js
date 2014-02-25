module.exports = function (app, config, authenticator, redisClient) {

  app.get('/oauth2/login', authenticator.oauth2.login);
  app.post('/oauth2/login', authenticator.oauth2.authenticate);
  app.get('/oauth2/authorize', authenticator.oauth2.authorization);
  app.post('/oauth2/authorize/decision', authenticator.oauth2.decision);
  app.post('/oauth2/token', authenticator.oauth2.token);

  app.get('/account/login'
    , function (req, res) {
      res.render('account/login', { message:req.flash('error')});
      //res.render('account/login', { message: undefined});
    });


  // TODO: Deprecate this and "ensureAuthenticated" to move to connect-ensure-login
  app.post('/account/login'
    , authenticator.passport.authenticate(authenticator.authenticationStrategy, { successReturnToOrRedirect: '/', failureRedirect:'/account', failureFlash:"Invalid username or password."})
    , function (req, res) {
      app.locals.app.locals.logger.log('debug', 'User Login:' + req.user.username, { username: req.user.username, requestID: req.id, sessionID: req.sessionID });
      backURL=req.header('Referer') || '/account';
      res.redirect(backURL);
    }
  );

  app.get('/account/logout'
    , function (req, res) {
      app.locals.app.locals.logger.log('debug', 'User Logout:' + req.user.username, { username: req.user.username, requestID: req.id, sessionID: req.sessionID });
      req.logout();
      res.redirect('/account');
    });

  app.locals.ensureAuthenticated = function (req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    } else {
      app.locals.logger.log('debug', 'user is not authenticated',  { username: 'none', requestID: req.id, sessionID: req.sessionID });
      res.render('account/login', { user: req.user, message: req.flash('error') });
      //res.render('account/login', { user: req.user, message: undefined });
    }
  }

  app.locals.ensureAPIAuthenticated = function (req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    } else {
      app.locals.logger.log('debug', 'API client is not authenticated',  { username: 'none', requestID: req.id, sessionID: req.sessionID });
      res.send(403);
    }
  }

  app.locals.requireGroup = function (group) {
    return function (req, res, next) {
      if (req.isAuthenticated() && req.user && req.user.groups.indexOf(group) > -1) {
        next();
      } else {
        if (req.user) {
          app.locals.logger.log('debug', req.user + ' is not a member of ' + group,  { username: req.user.username, requestID: req.id, sessionID: req.sessionID });
        } else {
          app.locals.logger.log('debug', 'this request requires authentication',  { username: 'none', requestID: req.id, sessionID: req.sessionID });
        }
        res.render('account/login', { user: req.user, message: req.flash('error') });
        //res.render('account/login', { user: req.user, message: undefined });
        /*, function (err, html) {
         if (err)
         {
         app.locals.logger.log('error', 'error rendering jade template', {error: err, requestID: req.id, sessionID: req.sessionID});
         res.send(500);
         } else {
         res.end(html);
         }
         });*/
      }
    }
  };
};
