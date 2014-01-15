module.exports = function (app, config, passport, redisClient) {
  app.get('/puppet/facts/:fact'
    , app.locals.requireGroup('users')
    , function (req, res) {
      var request = require('request');
      request({ url: app.get('puppetdb_uri') + '/facts/' + req.params.fact, json: true }
        , function (error, response, body) {
          if (error)
          {
            app.locals.logger.log('debug', 'failed to get data from PuppetDB', { uri: app.get('puppetdb_uri') + '/facts/' + req.params.fact});
            res.send(500);
          } else {
            app.locals.logger.log('debug', 'fetched data from PuppetDB', { uri: app.get('puppetdb_uri') + '/facts/' + req.params.fact});
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.write(JSON.stringify(body));
            res.end();
          }
        })
    });
}
