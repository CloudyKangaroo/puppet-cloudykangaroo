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
        var hoursAgo = 10;
        request({ url: app.get('puppetdb_uri') + '/events?query=["and", ["=", "status", "failure"],["=", "resource-type", "Service"],[">", "timestamp", "' + moment().subtract('hours', hoursAgo).format() + '"]]]&limit=1000', json: true }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          res.render('monitoring/failures', {hoursAgo: hoursAgo, failures: body, user:req.user, section: 'failures', navLinks: config.navLinks.monitoring });
        }
      })
    });

app.get('/devices'
  , function (req, res) {
      var async = require('async');
      var aSyncRequests = Array();

      aSyncRequests.push(
        function (callback) {
          var url = app.get('sensu_uri') + '/clients';
          var request = require('request')
          request({ url: url, json: true }
            , function (error, response, body) {
                if (error || !body || response.statusCode != 200) {
                  console.log(error);
                  callback(error, { response: response, type: 'error'});
                } else {
                  callback(error, { response: body, type: 'sensu'});
                }
            }
          );
        }
      );

      aSyncRequests.push(
        function (callback) {
          redisClient.get('device.list'
            , function (error, response) {
                if (error)
                {
                  callback(error, { response: response, type: 'error'});
                } else {
                  callback(error, { response: JSON.parse(response), type: 'ubersmith'});
                }
            }
          );
        }
      );

      aSyncRequests.push(
        function (callback) {
          var request = require('request')
          request({ url: app.get('puppetdb_uri') + '/nodes?query=["=", ["fact", "kernel"], "Linux"]', json: true }
            , function (error, response, body) {
              if (error)
              {
                callback(error, { response: response, type: 'error'});
              } else {
                callback(error, { response: body, type: 'puppet'});
              }
            }
          )
        }
      );

      async.parallel(aSyncRequests
        , function(error, results) {
            if (error) {
              console.log(error);
              res.send(500);
            } else {
              var hosts = {};

              for (g=0; g<results.length; g++)
              {
                var result = results[g];
                if (!result.type)
                {
                  console.log(JSON.stringify(result));
                  res.send(500);
                  return;
                }

                switch (result.type)
                {
                  case 'error':
                    console.log(result);
                    res.send(500);
                    return;
                    break;

                  case 'ubersmith':
                    var deviceList = result.response;

                    Object.keys(deviceList).forEach(function(device_id) {
                      var device = deviceList[device_id];
                      // Only Servers right now.
                      if (device.type == 1)
                      {
                        var hostname = device.dev_desc + '.contegix.mgmt';

                        console.log(result.type + ' ' + hostname);

                        if (hostname in hosts)
                        {
                          console.log('setting ubersmith to true for ' + hostname);
                          hosts[hostname].ubersmith = true;
                        } else {
                          console.log('adding new entry, via ubersmith, for  ' + hostname);
                          hosts[hostname] = {hostname: hostname, ubersmith: true, puppet: false, sensu:false};
                        }
                      }
                    });
                    break;

                  case 'puppet':
                    var deviceList = result.response;
                    for (t=0; t<deviceList.length; t++)
                    {
                      var device = deviceList[t];
                      var hostname = device.name;
                      console.log(result.type + ' ' + hostname);
                      if (hostname in hosts)
                      {
                        console.log('setting puppet to true for ' + hostname);
                        hosts[hostname].puppet = true;
                      } else {
                        console.log('adding new entry, via puppet, for  ' + hostname);
                        hosts[hostname] = {hostname: hostname, ubersmith: false, puppet: true, sensu:false};
                      }
                    }
                    break;

                  case 'sensu':
                    var deviceList = result.response;
                    for (z=0; z<deviceList.length; z++)
                    {
                      var device = deviceList[z];
                      var hostname = device.name;
                      console.log(result.type + ' ' + hostname);
                      if (hostname in hosts)
                      {
                        console.log('setting sensu to true for ' + hostname);
                        hosts[hostname].sensu = true;
                      } else {
                        console.log('adding new entry, via sensu, for  ' + hostname);
                        hosts[hostname] = {hostname: hostname, ubersmith: false, puppet: false, sensu: true};
                      }
                    }
                    break;
                  default:
                    console.log(result);
                }
              }
              var retHosts = {};
              Object.keys(hosts).forEach(function(hostname) {
                var host = hosts[hostname];
                if (host.ubersmith == false || host.puppet == false || host.sensu == false)
                {
                   retHosts[hostname] = host;
                }
              });
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.write(JSON.stringify(retHosts));
              res.end();
            }
        }
      );
  }
);

  app.get('/monitoring/clients'
    , function (req, res) {
        request({ url: app.get('sensu_uri') + '/clients', json: true }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          res.render('monitoring/clients', {clients: body, user:req.user, section: 'clients', navLinks: config.navLinks.monitoring });
        }
      })
    });

  app.get('/monitoring/devices'
    , app.locals.requireGroup('users')
    , function (req, res) {
      res.render('monitoring/devices', {user:req.user, section: 'clients', navLinks: config.navLinks.monitoring });
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
