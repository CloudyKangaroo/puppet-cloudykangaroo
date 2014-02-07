module.exports = function (app, config, passport, redisClient) {
  var request = require('request')

  app.get('/signage'
    , app.locals.ensureAuthenticated
    , function (req, res) {
      res.render('signage', { user:req.user, title: 'Signage' });
    }
  );
};