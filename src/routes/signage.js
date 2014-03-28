/* jshint unused: false */
module.exports = function (app, config, authenticator, redisClient) {
  "use strict";
  var passport = authenticator.passport;
  app.get('/signage', app.locals.ensureAuthenticated, function (req, res) {
    res.render('signage', { user:req.currentUser, title: 'Signage' });
  });
};
