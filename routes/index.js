module.exports = function (app, config, passport, redisClient) {
  require('./ubersmith')(app, config, passport, redisClient);
  require('./monitoring')(app, config, passport, redisClient);
  require('./account')(app, config, passport, redisClient);

  app.get('/'
    , function (req, res) {
      res.redirect('/account');
    });
}

