module.exports = function (app, config, authenticator, redisClient) {
  "use strict";

  require('./auth')(app, config, authenticator, redisClient);
  require('./ubersmith')(app, config, authenticator, redisClient);
  require('./monitoring')(app, config, authenticator, redisClient);
  require('./account')(app, config, authenticator, redisClient);
  require('./events')(app, config, authenticator, redisClient);
  require('./tickets')(app, config, authenticator, redisClient);
  require('./signage')(app, config, authenticator, redisClient);
  require('./api/v1')(app, config, authenticator, redisClient);

  app.get('/', function (req, res) {
    res.redirect('/account');
  });
};
