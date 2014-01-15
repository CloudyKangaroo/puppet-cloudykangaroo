/**
 * Created with JetBrains WebStorm.
 * User: jonathan
 * Date: 14/01/2014
 * Time: 21:56
 * To change this template use File | Settings | File Templates.
 */
module.exports = function (app, config, passport, redisClient) {
  var request = require('request');

  app.get('/sensu/events'
    , app.locals.requireGroup('users')
    , function (req, res) {
      request({ url: app.get('sensu_uri') + '/events', json: true }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          app.locals.logger.log('debug', 'fetched data from Sensu', { uri: app.get('sensu_uri') + '/events'});
          res.send(JSON.stringify({ aaData: body }));
        } else {
          app.locals.logger.log('error', 'Error processing request', { error: error, uri: app.get('sensu_uri') + '/events'})
          res.send(500);
        }
      })
    });

  app.get('/sensu/events/device/:device'
    , app.locals.requireGroup('users')
    , function (req, res) {
      if (req.params.device && req.params.device != '')
      {
        var uri = '/events/' + req.params.device;
      } else {
        var uri = '/events';
      }
      request({ url: app.get('sensu_uri') + uri, json: true }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          app.locals.logger.log('debug', 'fetched data from Sensu', { uri: app.get('sensu_uri') + uri});
          res.send(JSON.stringify(body));
        } else {
          app.locals.logger.log('error', 'Error processing request', { error: error, uri: app.get('sensu_uri') + uri})
          res.send(500);
        }
      })
    });
}