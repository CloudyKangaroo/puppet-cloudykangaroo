module.exports = function (app, config, passport, redisClient) {
  require('./ubersmith')(app, config, passport, redisClient);
  require('./monitoring')(app, config, passport, redisClient);
  require('./account')(app, config, passport, redisClient);
  require('./events')(app, config, passport, redisClient);
  require('./sensu')(app, config, passport, redisClient);
  require('./puppet')(app, config, passport, redisClient);

  app.get('/render'
    , function (req, res) {
      var phantom = require('phantom');
      var uuid = require('uuid').v4();
      var pdffile = '/tmp/'+uuid+'.pdf';

      //https://github.com/bruce/node-temp

      app.render('account', { user:req.user, section: 'profile', navLinks: config.navLinks.account, layout: false}, function(err, html){
        if (err) {
          app.locals.logger.log('error', 'error rendering template', { error: err });
          res.send(500);
        } else {
          phantom.create(function(ph) {
            ph.createPage(function(page) {
              app.locals.logger.log('debug', 'html content', { html: html });
              page.set('content', html);
              page.render(pdffile, function(err){
                if (err) {
                  app.locals.logger.log('error', 'error rendering page', { error: err });
                  res.send(500);
                } else {
                  var fileSystem = require('fs');
                  var stat = fileSystem.statSync(pdffile);
                  response.writeHead(200, {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': 'attachment; filename=' + uuid +'.pdf',
                    'Content-Length': stat.size
                  });

                  var readStream = fileSystem.createReadStream(pdffile);
                  // We replaced all the event handlers with a simple call to readStream.pipe()
                  readStream.pipe(response);
                }
                ph.exit();
              });
            });
          });
        }
      });
    });

  app.get('/'
    , function (req, res) {
      res.redirect('/account');
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
          //request({ url: app.get('puppetdb_uri') + '/nodes?query=["=", ["fact", ""], "Linux"]', json: true }
          request({ url: app.get('puppetdb_uri') + '/facts/serialnumber', json: true }
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
            app.locals.logger.log('error', 'Error executing parallel requests',{error: error});
            res.send(500);
          } else {
            var hosts = {};

            for (g=0; g<results.length; g++)
            {
              var result = results[g];
              if (!result.type)
              {
                app.locals.logger.log('error', 'Could not parse results' , {error: JSON.stringify(result)});
                res.send(500);
                return;
              }

              switch (result.type)
              {
                case 'error':
                  app.locals.logger.log('error',  'Could not parse results' , {error: JSON.stringify(result)});
                  res.send(500);
                  return;
                  break;

                case 'ubersmith':
                  var deviceList = result.response;

                  Object.keys(deviceList).forEach(function(device_id) {
                    var device = deviceList[device_id];
                    // Only Servers right now.
                    if (device.type_id == 1)
                    {
                      var hostname = device.dev_desc + '.contegix.mgmt';

//                        app.locals.logger.log('debug', result.type + ' ' + hostname);

                      if (hostname in hosts)
                      {
//                          app.locals.logger.log('debug', 'setting ubersmith to true for ' + hostname);
                        hosts[hostname].ubersmith = true;
                        hosts[hostname].ubersmith_deviceid = device.dev;
                        hosts[hostname].ubersmith_serialnumber = device.serialid;
                        hosts[hostname].ubersmith_location = device.rack_code;
                      } else {
                        hosts[hostname] = {hostname: hostname, ubersmith_deviceid: device.dev, ubersmith_serialnumber: device.serialid, ubersmith_location: device.rack_code, ubersmith: true, puppet_serialnumber: 'null', puppet: false, sensu:false};
                      }
                    }
                  });
                  break;

                case 'puppet':
                  var deviceList = result.response;
                  for (t=0; t<deviceList.length; t++)
                  {
                    var device = deviceList[t];
                    var hostname = device.certname;
//                      app.locals.logger.log('debug', result.type + ' ' + hostname);
                    if (hostname in hosts)
                    {
//                        app.locals.logger.log('debug', 'setting puppet to true for ' + hostname);
                      hosts[hostname].puppet = true;
                      hosts[hostname].puppet_serialnumber = device.value;
                    } else {
//                        app.locals.logger.log('debug', 'adding new entry, via puppet, for  ' + hostname);
                      hosts[hostname] = {hostname: hostname, ubersmith_deviceid: 'null', ubersmith_serialnumber: 'null', ubersmith_location: 'null', ubersmith: false, puppet_serialnumber: device.value, puppet: true, sensu:false};
                    }
                  }
                  break;

                case 'sensu':
                  var deviceList = result.response;
                  for (z=0; z<deviceList.length; z++)
                  {
                    var device = deviceList[z];
                    var hostname = device.name;
//                      app.locals.logger.log('debug', result.type + ' ' + hostname);
                    if (hostname in hosts)
                    {
//                        app.locals.logger.log('debug', 'setting sensu to true for ' + hostname);
                      hosts[hostname].sensu = true;
                    } else {
//                        app.locals.logger.log('debug', 'adding new entry, via sensu, for  ' + hostname);
                      hosts[hostname] = {hostname: hostname, ubersmith_deviceid: 'null', ubersmith_serialnumber: 'null', ubersmith_location: 'null', ubersmith: false, puppet_serialnumber: 'null', puppet: false, sensu: true};
                    }
                  }
                  break;
                default:
                  app.locals.logger.log('debug', result);
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
}

