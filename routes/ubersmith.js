module.exports = function (app, config, passport, redisClient) {
  var async = require('async');
  var request = require('request')

  app.get('/ubersmith'
    , app.locals.ensureAuthenticated
    , function (req, res) {
      res.render('ubersmith', {ticket_count: { low: redisClient.get('support.ticket_count.low'), normal: redisClient.get('support.ticket_count.normal'), high: redisClient.get('support.ticket_count.high'), urgent: redisClient.get('support.ticket_count.urgent')}, event_list: redisClient.get('uber.event_list'), user:req.user, section: 'dashboard', navLinks: config.navLinks.ubersmith });
    });

  // Ubersmith API Passthru
  app.get('/ubersmith/data/:key'
    , function (req, res) {
      var key = req.params.key;
      switch(key.toLowerCase())
      {
        case 'support.ticket_count.urgent':
        case 'support.ticket_count.normal':
        case 'support.ticket_count.low':
        case 'support.ticket_count.high':
        case 'support.ticket_count.total':
        case 'event_list':
        case 'device.type_list':
        case 'support.ticket_count':
        case 'support.ticket_list':
        case 'client.list':
        case 'device.list':
          redisClient.get(key.toLowerCase(), function (err, reply) {
            if (!reply) {
              res.send(500);
            } else {
              res.type('application/json');
              res.send(reply);
            }
          });
          break;
        default:
          res.send(400);
          break;
      }
    });
  app.get('/ubersmith/devices/location/rack/:rack'
    , function (req, res) {
      redisClient.get('device.list.location', function (err, reply) {
        console.log(err);
        if (!reply) {
          res.send(500);
        } else {
          var deviceListbyLocation = JSON.parse(reply);
          res.send(deviceListbyLocation['racks'][req.params.rack]);
        }
      });
    });
  app.get('/ubersmith/devices/location/facility/:facility'
    , function (req, res) {
      redisClient.get('device.list.location', function (err, reply) {
        console.log(err);
        if (!reply) {
          res.send(500);
        } else {
          var deviceListbyLocation = JSON.parse(reply);
          res.send(deviceListbyLocation[req.params.facility]);
        }
      });
    });
  app.get('/ubersmith/devices/location/facility/:facility/zone/:zone'
    , function (req, res) {
      redisClient.get('device.list.location', function (err, reply) {
        console.log(err);
        if (!reply) {
          res.send(500);
        } else {
          var deviceListbyLocation = JSON.parse(reply);
          res.send(deviceListbyLocation[req.params.facility][req.params.zone]);
        }
      });
    });
  app.get('/ubersmith/devices/location/facility/:facility/zone/:zone/cage/:cage'
    , function (req, res) {
      redisClient.get('device.list.location', function (err, reply) {
        console.log(err);
        if (!reply) {
          res.send(500);
        } else {
          var deviceListbyLocation = JSON.parse(reply);
          res.send(deviceListbyLocation[req.params.facility][req.params.zone][req.params.cage]);
        }
      });
    });
  app.get('/ubersmith/devices/location/facility/:facility/zone/:zone/cage/:cage/row/:row'
    , function (req, res) {
      redisClient.get('device.list.location', function (err, reply) {
        console.log(err);
        if (!reply) {
          res.send(500);
        } else {
          var deviceListbyLocation = JSON.parse(reply);
          res.send(deviceListbyLocation[req.params.facility][req.params.zone][req.params.cage][req.params.row]);
        }
      });
    });
  app.get('/ubersmith/devices/location/facility/:facility/zone/:zone/cage/:cage/row/:row/rack/:rack'
    , function (req, res) {
      redisClient.get('device.list.location', function (err, reply) {
        console.log(err);
        if (!reply) {
          res.send(500);
        } else {
          var deviceListbyLocation = JSON.parse(reply);
          res.send(deviceListbyLocation[req.params.facility][req.params.zone][req.params.cage][req.params.row][req.params.rack]);
        }
      });
    });
  app.get('/ubersmith/devices/location/facility/:facility/zone/:zone/cage/:cage/row/:row/rack/:rack/pos/:pos'
    , function (req, res) {
      redisClient.get('device.list.location', function (err, reply) {
        console.log(err);
        if (!reply) {
          res.send(500);
        } else {
          var deviceListbyLocation = JSON.parse(reply);
          res.send(deviceListbyLocation[req.params.facility][req.params.zone][req.params.cage][req.params.row][req.params.rack][req.params.pos]);
        }
      });
    });
  // Device Browser
  app.get('/ubersmith/devices'
    , function (req, res) {
      redisClient.get('device.type_list', function (err, reply) {
        console.log(err);
        if (!reply) {
          res.send(500);
        } else {
          var deviceTypeList = JSON.parse(reply);
          res.render('ubersmith/devices', { device_types: deviceTypeList, user:req.user, section: 'devices', navLinks: config.navLinks.ubersmith });
        }
      });
    });

  // Used to view a single device
  app.get('/ubersmith/devices/deviceid/:deviceid'
    , function (req, res) {
      redisClient.get('device.list', function (err, reply) {
        if (!reply) {
          console.log('Sending 500: ' + err);
          res.send(500);
        } else {
          var deviceList = JSON.parse(reply);
          var uberDevice = deviceList[req.params.deviceid];
          request({ url: app.get('sensu_uri') + '/events/' + uberDevice.dev_desc + '.contegix.mgmt', json: true }
            , function (error, response, body) {
              if (!error) {
                if (response.statusCode < 300 && body.length > 0)
                {
                  var sensuEvents = body;
                } else {
                  var sensuEvents = [ { output: "No Events Found", status: 1, issued: Date.now(), handlers: [], flapping: false, occurrences: 0, client: uberDevice.dev_desc + '.contegix.mgmt', check: 'N/A'}];
                }
                request({url: app.get('sensu_uri')+ '/client/' + uberDevice.dev_desc + '.contegix.mgmt', json: true}
                  , function (error, response, body) {
                    if (!error) {
                      if (response.statusCode < 300)
                      {
                        var sensuClient = body;
                      } else {
                        var sensuClient = { address: 'unknown', name: uberDevice.dev_desc, safe_mode: 0, subscriptions: [], timestamp: 0 };
                      }
                      res.render('ubersmith/device', {uberDevice: uberDevice, sensuClient: sensuClient, sensuEvents: sensuEvents, user:req.user, section: 'devices', navLinks: config.navLinks.ubersmith });
                    } else {
                      console.log('Got ' + response.statusCode + ' Sending 500: ' + error);
                      res.send(500);
                    }
                  })
              } else {
                console.log('Got ' + response.statusCode + ' Sending 500: ' + error);
                res.send(500);
              }
            })
        }
      });
    });
  app.get('/ubersmith/devices/hostname/:hostname'
    , function (req, res) {
      redisClient.get('device.list.hostname', function (err, reply) {
        if (!reply) {
          console.log('Sending 500: ' + err);
          res.send(500);
        } else {
          var deviceList = JSON.parse(reply);
          if (!(req.params.hostname in deviceList))
          {
            app.locals.logger.log('error', 'invalid hostname', {error: 'hostname ' + req.params.hostname + ' not in device list'});
            res.send(500);
            return;
          }
          var uberDevice = deviceList[req.params.hostname][0];

          app.locals.logger.log('debug', 'requested hostname ' + req.params.hostname);


          request({ url: app.get('sensu_uri') + '/events/' +  req.params.hostname, json: true }
            , function (error, response, body) {
              if (!error) {
                if (response.statusCode < 300 && body.length > 0)
                {
                  var sensuEvents = body;
                } else {
                  var sensuEvents = [ { output: "No Events Found", status: 1, issued: Date.now(), handlers: [], flapping: false, occurrences: 0, client:  req.params.hostname, check: 'N/A'}];
                }
                request({url: app.get('sensu_uri')+ '/client/' +  req.params.hostname, json: true}
                  , function (error, response, body) {
                    if (!error) {
                      if (response.statusCode < 300)
                      {
                        var sensuClient = body;
                      } else {
                        var sensuClient = { address: 'unknown', name:  req.params.hostname, safe_mode: 0, subscriptions: [], timestamp: 0 };
                      }
                      console.log(uberDevice);
                      //app.locals.logger.log('debug', 'device', {device: JSON.stringify(uberDevice)});
                      res.render('ubersmith/device', {uberDevice: uberDevice, sensuClient: sensuClient, sensuEvents: sensuEvents, user:req.user, section: 'devices', navLinks: config.navLinks.ubersmith });
                    } else {
                      console.log('Got ' + response.statusCode + ' Sending 500: ' + error);
                      res.send(500);
                    }
                  })
              } else {
                console.log('Got ' + response.statusCode + ' Sending 500: ' + error);
                res.send(500);
              }
            })
        }
      });
    });

  app.get('/ubersmith/devices/clientid/:clientid'
    , function (req, res) {
      redisClient.get('device.list', function (err, reply) {
        if (!reply) {
          console.log('Sending 500: ' + err);
          res.send(500);
        } else {
          var deviceList = JSON.parse(reply);
          var uberDevice = deviceList[req.params.deviceid];
          request({ url: app.get('sensu_uri') + '/events/' + uberDevice.dev_desc + '.contegix.mgmt', json: true }
            , function (error, response, body) {
              if (!error) {
                if (response.statusCode < 300 && body.length > 0)
                {
                  var sensuEvents = body;
                } else {
                  var sensuEvents = [ { output: "No Events Found", status: 1, issued: Date.now(), handlers: [], flapping: false, occurrences: 0, client: uberDevice.dev_desc + '.contegix.mgmt', check: 'N/A'}];
                }
                request({url: app.get('sensu_uri')+ '/client/' + uberDevice.dev_desc + '.contegix.mgmt', json: true}
                  , function (error, response, body) {
                    if (!error) {
                      if (response.statusCode < 300)
                      {
                        var sensuClient = body;
                      } else {
                        var sensuClient = { address: 'unknown', name: uberDevice.dev_desc, safe_mode: 0, subscriptions: [], timestamp: 0 };
                      }
                      res.render('ubersmith/device', {uberDevice: uberDevice, sensuClient: sensuClient, sensuEvents: sensuEvents, user:req.user, section: 'devices', navLinks: config.navLinks.ubersmith });
                    } else {
                      console.log('Got ' + response.statusCode + ' Sending 500: ' + error);
                      res.send(500);
                    }
                  })
              } else {
                console.log('Got ' + response.statusCode + ' Sending 500: ' + error);
                res.send(500);
              }
            })
        }
      });
    });

  // Used by device browser, returns table data
  app.get('/ubersmith/devices/list/:devtype_group_id'
    , function (req, res) {
      var aReturn = Array();
      var foundSome = false;
      var filteredDevice = {};
      redisClient.get('device.list', function (err, reply) {
        if (!reply) {
          res.send(500);
        } else {
          var deviceList = JSON.parse(reply);
          Object.keys(deviceList).forEach(function(device_id) {
            device = deviceList[device_id];
            if (device.devtype_group_id == req.params.devtype_group_id) {
              filteredDevice = { 'device': device.dev, 'type': device.type, 'desc': device.dev_desc, 'company': device.company, 'location': device.location, 'status': device.device_status};
              aReturn.push(filteredDevice);
              foundSome = true;
            }
          })

          if (foundSome) {
            res.type('application/json');
            res.send(JSON.stringify({ aaData: aReturn }));
          } else {
            res.send(404);
          }
        }
      });
    });

  app.get('/ubersmith/exceptions'
    , function (req, res) {
      var aReturn = Array();
      var aSyncRequests = Array();
      var foundSome = false;

      redisClient.get('device.list'
        , function (err, reply) {
          if (!reply) {
            console.log(err);
            res.send(500);
          } else {
            var deviceList = JSON.parse(reply);
            Object.keys(deviceList).forEach(
              function (device_id) {
                var uberDevice = deviceList[device_id];
                var url = app.get('sensu_uri') + '/client/' + uberDevice.dev_desc + '.contegix.mgmt';
                if (uberDevice.devtype_group_id == 1) {
                  aSyncRequests.push(
                    function (callback) {
                      request({ url: url, json: true }
                        , function (error, response, body) {
                          if (error) {
                            callback(error, response);
                          } else {
                            callback(error, { device: uberDevice.dev, desc: uberDevice.dev_desc + '.contegix.mgmt', status: response.statusCode});
                          }
                        })
                    });
                }
              })
            async.parallel(aSyncRequests
              , function(error, results) {
                if (error) {
                  console.log(err);
                  res.send(500);
                } else {
                  for (var i = 0; i < results.length; i++) {
                    var result = results[i];
                    if (result.status == 404)
                    {
                      aReturn.push(result);
                    }
                  }
                  res.send(JSON.stringify(aReturn));
                }
              });
          }
        });
    });
/*  // Not yet used, returns a specific device
  app.get('/ubersmith/devices/device/:device_id'
    , function (req, res) {
      var deviceList = redisClient.get('device.list');
      if (!deviceList[req.params.device_id]) {
        res.send(404);
      } else {
        res.type('application/json');
        res.send(JSON.stringify(deviceList[req.params.device_id]));
      }
    });
*/
  // Ubersmith Customer Browser
  app.get('/ubersmith/clients'
    , function (req, res) {
      res.render('ubersmith/clients', { user:req.user, section: 'devices', navLinks: config.navLinks.ubersmith });
    });

  app.get('/ubersmith/clients/company/:company/devices'
    , function (req, res) {
      redisClient.get('device.list.company', function (err, reply) {
        if (!reply)
        {
          res.send(500);
        } else {
          var deviceListByCompany = JSON.parse(reply);
          var deviceList = deviceListByCompany[req.params.company];
          res.send(JSON.stringify(deviceList));
        }
      })
    });

  app.get('/ubersmith/clients/clientid/:clientid/devices'
    , function (req, res) {
      redisClient.get('device.list.clientid', function (err, reply) {
        if (!reply)
        {
          res.send(500);
        } else {
          var deviceListByClientID = JSON.parse(reply);
          var deviceList = deviceListByClientID[req.params.clientid];
          res.send(JSON.stringify(deviceList));
        }
      })
    });

  // Used by Customer Browser, returns table data
  app.get('/ubersmith/clients/list'
    , function (req, res) {
      var aReturn = Array();
      var foundSome = false;
      var filteredDevice = {};

      redisClient.get('client.list', function (err, reply) {

        if (!reply) {
          res.send(500);
        } else {
          var clientList= JSON.parse(reply);
          Object.keys(clientList).forEach(function(clientid) {
            client = clientList[clientid];
            if (client.company != 'REMOVED') {
              var offset = moment(client.created*1000);
              var created = offset.format('MMM DD H:mm:ss');
              filteredDevice = Array(client.clientid, client.full_name, client.listed_company, client.salesperson, client.acctmgr, created);
              aReturn.push(filteredDevice);
              foundSome = true;
            }
          })

          if (foundSome) {
            res.type('application/json');
            res.send(JSON.stringify({ aaData: aReturn }));
          } else {
            res.send(404);
          }
        }
      });
    });

  app.post('/ubersmith/event/*'
    , function(req, res){
      var form = new formidable.IncomingForm;
      console.log(req.path);
      form.parse(req, function(err, fields, files){
        if (err) return res.end('You found error');
        console.log(fields);
      });

      form.on('progress', function(bytesReceived, bytesExpected) {
  //    console.log(bytesReceived + ' ' + bytesExpected);
      });

      form.on('error', function(err) {
        res.writeHead(200, {'content-type': 'text/plain'});
        res.end('error:\n\n'+util.inspect(err));
      });

      res.writeHead(200, {'content-type': 'text/plain'});
      res.end('complete');
    });
}
