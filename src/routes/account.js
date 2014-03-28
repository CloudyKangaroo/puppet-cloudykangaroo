/* jshint unused: false */
module.exports = function (app, config, authenticator, redisClient) {
  "use strict";
  var passport = authenticator.passport;
  app.get('/account', app.locals.ensureAuthenticated, function (req, res) {
      res.render('account', { user:req.currentUser, section: 'profile', navLinks: config.navLinks.account });
    }
  );

  app.get('/account/chat', function (req, res) {
      res.render('account/chat', { user:req.currentUser, section: 'chat', navLinks: config.navLinks.account });
    });

  app.post('/account/chat', function (req, res) {
      res.render('account/chat', { user:req.currentUser, section: 'chat', navLinks: config.navLinks.account });
    });
};
