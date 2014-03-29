module.exports = function (app, config, authenticator) {
  "use strict";

  var authConfig = { successReturnToOrRedirect: '/', failureRedirect:'/account', failureFlash:"Invalid username or password."};
  var authStrategy = authenticator.authenticationStrategy;

  var logData = function(req) {
    var username = 'none';
    if (req.currentUser && req.currentUser.username) {
      username = req.currentUser.username;
    }
    return { username: username, requestID: req.id, sessionID: req.sessionID };
  };

  app.get('/oauth2/login', authenticator.oauth2.login);
  app.post('/oauth2/login', authenticator.oauth2.authenticate);
  app.get('/oauth2/authorize', authenticator.oauth2.authorization);
  app.post('/oauth2/authorize/decision', authenticator.oauth2.decision);
  app.post('/oauth2/token', authenticator.oauth2.token);

  app.get('/account/login', function (req, res) {
    res.render('account/login', { message:req.flash('error')});
  });

  // TODO: Deprecate this and "ensureAuthenticated" to move to connect-ensure-login
  app.post('/account/login', authenticator.passport.authenticate(authStrategy, authConfig),  function (req, res) {
    app.locals.app.locals.logger.log('debug', 'User Login:' + req.currentUser.username, logData(req));
    res.redirect(req.header('Referer') || '/account');
  });

  app.get('/account/logout', function (req, res) {
    app.locals.app.locals.logger.log('debug', 'User Logout:' + req.currentUser.username, logData(req));
    req.logout();
    res.redirect('/account');
  });
};