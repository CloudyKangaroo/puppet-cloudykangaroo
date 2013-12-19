module.exports = function (app, config, passport, redisClient) {
  var request = require('request')

  app.get('/monitoring'
    , app.locals.requireGroup('users')
    , function (req, res) {
        request({ url: app.get('sensu_uri') + '/info', json: true }
        , function (error, response, body) {
          if (!error && response.statusCode == 200) {
            res.render('monitoring', {info: body, user:req.user, section: 'info', navLinks: config.navLinks.monitoring });
          }
        })
    });

  app.get('/monitoring/events'
    , app.locals.requireGroup('users')
    , function (req, res) {
        request({ url: app.get('sensu_uri') + '/events', json: true }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          res.render('monitoring/events', {events: body, user:req.user, section: 'events', navLinks: config.navLinks.monitoring });
        }
      })
    });

  app.get('/monitoring/stashes'
    , app.locals.requireGroup('users')
    , function (req, res) {
        request({ url: app.get('sensu_uri') + '/stashes', json: true }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          res.render('monitoring/stashes', {stashes: body, user:req.user, section: 'stashes', navLinks: config.navLinks.monitoring });
        }
      })
    });

  app.get('/monitoring/checks'
    , app.locals.requireGroup('users')
    , function (req, res) {
        request({ url: app.get('sensu_uri') + '/checks', json: true }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          res.render('monitoring/checks', {checks: body, user:req.user, section: 'checks', navLinks: config.navLinks.monitoring });
        }
      })
    });

  app.get('/monitoring/failures'
    , app.locals.requireGroup('users')
    , function (req, res) {
        request({ url: app.get('puppetdb_uri') + '/events?query=["and",%20["=",%20"status",%20"failure"],["=",%20"resource-title",%20"contegix-sensu-client"],["=",%20"resource-type",%20"Service"]]]&limit=1000', json: true }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          res.render('monitoring/failures', {failures: body, user:req.user, section: 'failures', navLinks: config.navLinks.monitoring });
        }
      })
    });

  app.get('/monitoring/clients'
    , app.locals.requireGroup('users')
    , function (req, res) {
        request({ url: app.get('sensu_uri') + '/clients', json: true }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          res.render('monitoring/clients', {clients: body, user:req.user, section: 'clients', navLinks: config.navLinks.monitoring });
        }
      })
    });

  app.get('/monitoring/exceptions'
    , app.locals.requireGroup('users')
    , function (req, res) {
        request({ url: app.get('sensu_uri') + '/clients', json: true }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          var sensuClients = body;
          console.log(sensuClients);
        }
      })
    });

  app.post('/monitoring/stashes/:server'
    , function (req, res) {
      var expiration = new Date(oldDateObj.getTime() + 30*60000);
      request.post({
        url: app.get('sensu_uri') + '/stashes/silence/' + server,
        body: "{ 'timestamp': " + Date.now() + ", 'expires': " + expiration + " }"
      }, function(error, response, body){
        console.log(body);
      });
    });
}
