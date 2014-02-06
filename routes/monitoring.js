module.exports = function (app, config, passport, redisClient) {
  var request = require('request')

  app.get('/monitoring'
    , app.locals.requireGroup('users')
    , function (req, res) {
        request({ url: app.get('sensu_uri') + '/info', json: true }
        , function (error, response, body) {
          var moment = require('moment');
          if (!error && response.statusCode == 200) {
            app.locals.logger.log('debug', 'fetched data from Sensu', { uri: app.get('sensu_uri') + '/info'});
            var lastIncident = moment('Jan 01, 2014');
            //var sinceLastIncident = lastIncident.diff(moment()).format('d');
            var sinceLastIncident = moment().diff(moment('01/01/2014 00:00:00',"DD/MM/YYYY HH:mm:ss"), 'days');
            res.render('monitoring', {sinceLastIncident:  sinceLastIncident, info: body, user:req.user, section: 'info', navLinks: config.navLinks.monitoring });
          } else {
            app.locals.logger.log('error', 'error processing request', { error: error, uri: app.get('sensu_uri') + '/info'})
            res.send(500);
          }
        })
    });

  app.get('/monitoring/events'
    , app.locals.requireGroup('users')
    , function (req, res) {
        request({ url: app.get('sensu_uri') + '/events', json: true }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          app.locals.logger.log('debug', 'fetched data from Sensu', { uri: app.get('sensu_uri') + '/events'});
          res.render('monitoring/events', {events: body, user:req.user, section: 'events', navLinks: config.navLinks.monitoring });
        } else {
          app.locals.logger.log('error', 'error processing request', { error: error, uri: app.get('sensu_uri') + '/events'})
          res.send(500);
        }
      })
    });

  app.get('/monitoring/events/device/:hostname'
    , app.locals.requireGroup('users')
    , function (req, res) {
      request({ url: app.get('sensu_uri') + '/events/' + req.params.hostname, json: true }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          app.locals.logger.log('debug', 'fetched data from Sensu', { uri: app.get('sensu_uri') + '/events/' + req.params.hostname});
          res.render('monitoring/events', {events: body, user:req.user, section: 'events', navLinks: config.navLinks.monitoring });
        } else {
          app.locals.logger.log('error', 'Error processing request', { error: error, uri: app.get('sensu_uri') + '/events/' + req.params.hostname})
          res.send(500);
        }
      })
    });

  app.get('/monitoring/stashes'
    , app.locals.requireGroup('users')
    , function (req, res) {
        request({ url: app.get('sensu_uri') + '/stashes', json: true }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          app.locals.logger.log('debug', 'fetched data from Sensu', { uri: app.get('sensu_uri') + '/stashes'});
          res.render('monitoring/stashes', {stashes: body, user:req.user, section: 'stashes', navLinks: config.navLinks.monitoring });
        } else {
          app.locals.logger.log('error', 'Error processing request', { error: error, uri: app.get('sensu_uri') + '/stashes'})
          res.send(500);
        }
      })
    });

  app.get('/monitoring/checks'
    , app.locals.requireGroup('users')
    , function (req, res) {
        request({ url: app.get('sensu_uri') + '/checks', json: true }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          app.locals.logger.log('debug', 'fetched data from Sensu', { uri: app.get('sensu_uri') + '/checks'});
          res.render('monitoring/checks', {checks: body, user:req.user, section: 'checks', navLinks: config.navLinks.monitoring });
        } else {
          app.locals.logger.log('error', 'Error processing request', { error: error, uri: app.get('sensu_uri') + '/checks'})
          res.send(500);
        }
      })
    });

  app.get('/monitoring/failures'
    , app.locals.requireGroup('users')
    , function (req, res) {
      var hoursAgo = 10;
      res.render('monitoring/failures', {hoursAgo: hoursAgo, user:req.user, section: 'failures', navLinks: config.navLinks.monitoring });
    });

  app.get('/monitoring/clients'
    , app.locals.requireGroup('users')
    , function (req, res) {
      request({ url: app.get('sensu_uri') + '/clients', json: true }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          app.locals.logger.log('debug', 'fetched data from PuppetDB', { uri: app.get('sensu_uri') + '/clients'});
          res.render('monitoring/clients', {clients: body, user:req.user, section: 'clients', navLinks: config.navLinks.monitoring });
        } else {
          app.locals.logger.log('error', 'Error processing request', { error: error, uri: app.get('sensu_uri') + '/clients'})
          res.send(500);
        }
      })
    });

  app.get('/monitoring/list/clients'
    , app.locals.requireGroup('users')
    , function (req, res) {
      var _ = require('underscore');
      request({ url: app.get('sensu_uri') + '/clients', json: true}, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          app.locals.logger.log('debug', 'fetched data from PuppetDB', { uri: app.get('sensu_uri') + '/clients'});
          var clients = body;
          for (i=0; i<clients.length; i++)
          {
            clients[i].timestamp = app.locals.getFormattedTimestamp(clients[i].timestamp);
          }
          res.type('application/json');
          res.send(JSON.stringify({ aaData: clients }));
        } else {
          app.locals.logger.log('error', 'Error processing request', { error: error, uri: app.get('sensu_uri') + '/clients'})
          res.send(500);
        }
      });
  });

  app.get('/monitoring/devices'
    , app.locals.requireGroup('users')
    , function (req, res) {
      res.render('monitoring/devices', {user:req.user, section: 'clients', navLinks: config.navLinks.monitoring });
    });

  app.post('/monitoring/stashes/:server'
    , app.locals.requireGroup('users')
    , function (req, res) {
      var expiration = new Date(oldDateObj.getTime() + 30*60000);
      request.post({
        url: app.get('sensu_uri') + '/stashes/silence/' + server,
        body: "{ 'timestamp': " + Date.now() + ", 'expires': " + expiration + " }"
      }, function(error, response, body){
        app.locals.logger.log('debug', body);
      });
    });
}
