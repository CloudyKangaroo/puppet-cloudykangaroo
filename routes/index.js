module.exports = function (app, config, authenticator, redisClient) {
  var passport = authenticator.passport;

  require('./auth')(app, config, authenticator, redisClient);
  require('./ubersmith')(app, config, passport, redisClient);
  require('./monitoring')(app, config, passport, redisClient);
  require('./account')(app, config, passport, redisClient);
  require('./events')(app, config, passport, redisClient);
  require('./tickets')(app, config, passport, redisClient);
  require('./signage')(app, config, passport, redisClient);
  require('./api/v1')(app, config, passport, redisClient);

  app.get('/'
    , function (req, res) {
      res.redirect('/account');
    });
}

