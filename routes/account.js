module.exports = function (app, config, passport, redisClient) {
  var request = require('request')

  app.get('/account'
    , app.locals.ensureAuthenticated
    , function (req, res) {
      res.render('account', { user:req.user, section: 'profile', navLinks: config.navLinks.account });
    }
  );

  app.get('/account/chat'
    , function (req, res) {
      res.render('account/chat', { user:req.user, section: 'chat', navLinks: config.navLinks.account });
    });

  app.post('/account/chat'
    , function (req, res) {
      res.render('account/chat', { user:req.user, section: 'chat', navLinks: config.navLinks.account });
    });
}
