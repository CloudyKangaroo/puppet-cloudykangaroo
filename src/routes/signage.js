/* jshint unused: false */
module.exports = function (app, config, passport, redisClient) {
  "use strict";

  app.get('/signage', app.locals.ensureAuthenticated, function (req, res) {
    res.render('signage', { user:req.user, title: 'Signage' });
  });
};
