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

  app.get('/account/login'
    , function (req, res) {
      res.render('account/login', { message:req.flash('error')});
    });

  app.post('/account/login'
    , passport.authenticate('atlassian-crowd'
    , { failureRedirect:'/account', failureFlash:"Invalid username or password."})
    , function (req, res) {
       app.locals.logger.log('debug', 'User Login:' + req.user.username, { username: req.user.username, requestID: req.id, sessionID: req.sessionID });
        backURL=req.header('Referer') || '/account';
        res.redirect(backURL);
    });

  app.get('/account/logout'
    , function (req, res) {
       app.locals.logger.log('debug', 'User Logout:' + req.user.username, { username: req.user.username, requestID: req.id, sessionID: req.sessionID });
       req.logout();
       res.redirect('/account');
    });
}
