module.exports = function (app, config, passport, redisClient) {
  var request = require('request')

  app.get('/account'
    , app.locals.ensureAuthenticated
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
}
