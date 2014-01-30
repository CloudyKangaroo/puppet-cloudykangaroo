module.exports = function (app, config, passport, redisClient) {
  app.get('/api/v1/puppet/devices/hostname/:hostname'
    , app.locals.requireGroup('users')
    , function (req, res) {
      app.locals.getPuppetDevice(req.params.hostname
        , function (err, device) {
          if (err) {
            res.send(500);
          } else {
            var resBody = JSON.stringify({ aaData: device });
            res.type('application/json');
            res.send(resBody);
          }
        })
    });

  app.get('/api/v1/puppet/devices/hostname/:hostname/facts'
    , app.locals.requireGroup('users')
    , function (req, res) {
      var _ = require('underscore');
      var request = require('request');
      var hostname = req.params.hostname;
      app.locals.getPuppetDevice(hostname
        , function (err, device) {
          if (err) {
            res.send(500);
          } else {
            var resBody = JSON.stringify({ aaData: device.factsArray });
            res.type('application/json');
            res.send(resBody);
          }
        })
    });

  app.get('/api/v1/sensu/events'
    , app.locals.requireGroup('users')
    , function (req, res) {
      var _ = require('underscore');
      var request = require('request');
      app.locals.ubersmith.getDeviceHostnames(function (err, deviceHostnames){
        if (deviceHostnames == null)
        {
          res.send(500);
        } else {
          request({ url: app.get('sensu_uri') + '/events', json: true }, function (error, response, body) {
            if (!error && response.statusCode == 200) {
              var events = [];
              _.each(body, function(event) {
                _.defaults(event, deviceHostnames[event.client]);
                event['issued'] = app.locals.getFormattedTimestamp(event['issued']);
                events.push(event);
              });
              app.locals.logger.log('debug', 'fetched data from Sensu', { uri: app.get('sensu_uri') + '/events'});
              res.type('application/json');
              res.send(JSON.stringify({ aaData: events }));
            } else {
              app.locals.logger.log('error', 'Error processing request', { error: error, uri: app.get('sensu_uri') + '/events'})
              res.send(500);
            }
          });
        }
      });
    });

  // UNSILENCE an CLIENT
  app.delete('/api/v1/sensu/silence/client/:client'
    , app.locals.requireGroup('users')
    , function (req, res) {
      var request = require('request');
      var path = 'silence/' + req.params.client;
      request.del({ url: app.get('sensu_uri') + '/stashes/' + path, json: true }
        , function (error, response) {
          if(error){
            res.send(500);
          } else {
            res.send(204);
          }
        });
    });
 
  // GET STASHES THAT MATCH ^stash
  app.get('/api/v1/sensu/stashes/:stash'
    , app.locals.requireGroup('users')
    , function (req, res) {
      app.locals.getSensuStashes(req.params.stash
        , function (err, response) {
          if (err) {
            res.send(500);
          } else {
            res.type('application/json');
            res.send(response);
          }
      })
  });

  // SILENCE a CLIENT
  app.post('/api/v1/sensu/silence/client/:client'
    , app.locals.requireGroup('users')
    , function (req, res) {
      console.log(req.body);
      app.locals.silenceClient(req.params.client, parseInt(req.body.expires)
        , function (err, response) {
          if (err) {
            res.send(500);
          } else {
            res.send(202);
          }
      })
  });

  // SILENCE a CHECK
  app.post('/api/v1/sensu/silence/client/:client/check/:check'
    , app.locals.requireGroup('users')
    , function (req, res) {
      app.locals.silenceCheck(req.params.client, req.params.check, parseInt(req.body.expires)
        , function (err, response) {
          if (err) {
            res.send(500);
          } else {
            res.send(202);
          }
      })
  });

  // GET SILENCED CLIENTS
  app.get('/api/v1/sensu/silence/client/:client'
    , app.locals.requireGroup('users')
    , function (req, res) {
      var request = require('request');
      var path = 'silence/' + req.params.client;
      request({ url: app.get('sensu_uri') + '/stashes/' + path, json: true }
        , function (error, response) {
          if(error){
            res.send(500);
          } else {
            res.type('application/json');
            res.send(JSON.stringify({aaData: response.body}));
          }
        });
    });

  // UNSILENCE A CHECK
  app.delete('/api/v1/sensu/silence/client/:client/check/:check'
    , app.locals.requireGroup('users')
    , function (req, res) {
      var request = require('request');
      var path = 'silence/' + req.params.client + '/' + req.params.check;
      request.del({ url: app.get('sensu_uri') + '/stashes/' + path, json: true }
        , function (error, response) {
          if(error){
            res.send(500);
          } else {
            res.send(204);
          }
        });
    });

  // GET SILENCED CHECKS
  app.get('/api/v1/sensu/silence/client/:client/check/:check'
    , app.locals.requireGroup('users')
    , function (req, res) {
      var request = require('request');
      var path = 'silence/' + req.params.client + '/' + req.params.check;
      request({ url: app.get('sensu_uri') + '/stashes/' + path, json: true }
        , function (error, response) {
          if(error){
            res.send(500);
          } else {
            res.type('application/json');
            res.send(JSON.stringify({aaData: response.body}));
          }
        });
    });

  // GET A STASH
  app.get('/api/v1/sensu/silence/:path'
    , app.locals.requireGroup('users')
    , function (req, res) {
      var request = require('request');
      request({ url: app.get('sensu_uri') + '/stashes/' + req.params.path, json: true }
        , function (error, response) {
          if(error){
            res.send(500);
          } else {
            res.type('application/json');
            res.send(JSON.stringify({aaData: response.body}));
          }
        });
    });

  // GET ALL STASHES
  app.get('/api/v1/sensu/silence'
    , app.locals.requireGroup('users')
    , function (req, res) {
      var request = require('request');
      request({ url: app.get('sensu_uri') + '/stashes', json: true }
        , function (error, response) {
          if(error){
            res.send(500);
          } else {
            res.type('application/json');
            res.send(JSON.stringify({aaData: response.body}));
          }
        });
    });

  app.get('/api/v1/sensu/clients'
    , app.locals.requireGroup('users')
    , function (req, res) {
      app.locals.ubersmith.getDeviceHostnames(function (err, deviceHostnames){
        if (deviceHostnames == null)
        {
          res.send(500);
        } else {
          var _ = require('underscore');
          var request = require('request');
          request({ url: app.get('sensu_uri') + '/clients', json: true }
            , function (error, response) {
              if(error){
                res.send(500);
              } else {
                var sensuDeviceList = response.body;
                var deviceList = [];
                _.each(sensuDeviceList, function (device)
                {
                  _.defaults(device, deviceHostnames[device.name]);
                  _.defaults(device, {name: '', address: '', email: '', company: '', full_name: '', location: ''});
                  device.timestamp = app.locals.getFormattedTimestamp(device.timestamp);
                  deviceList.push(device);
                });
                res.type('application/json');
                res.send(JSON.stringify({aaData: deviceList}));
              }
            });
        }
      });
    });

  app.get('/api/v1/sensu/devices/hostname/:hostname'
    , app.locals.requireGroup('users')
    , function (req, res) {
      app.locals.getSensuDevice(req.params.hostname
        , function (err, device) {
          if (err) {
            res.send(500);
          } else {
            res.type('application/json');
            res.send(JSON.stringify({ aaData: [device] }));
          }
        })
    });

  app.get('/api/v1/sensu/devices/hostname/:hostname/events'
    , app.locals.requireGroup('users')
    , function (req, res) {
      app.locals.getSensuDevice(req.params.hostname
        , function (err, device) {
          if (err) {
            res.send(500);
          } else {
            res.type('application/json');
            res.send(JSON.stringify({ aaData: [device.events] }));
          }
        })
    });

  app.get('/api/v1/ubersmith/devices/devgroupid/:devgroupid'
    , app.locals.requireGroup('users')
    , function (req, res) {
      app.locals.ubersmith.getDevicesbyTypeGroupID(req.params.devgroupid
        , function (err, deviceList){
          if (deviceList == null)
          {
            res.send(500);
          } else {
            var devices = new Array();
            Object.keys(deviceList).forEach(function(deviceID) {
              var device = deviceList[deviceID];
              devices.push(device);
            })
            res.type('application/json');
            res.send(JSON.stringify({ aaData: devices}));
          }
        });
    });

  app.get('/api/v1/ubersmith/devices/hostname'
    , app.locals.requireGroup('users')
    , function (req, res) {
        app.locals.ubersmith.getDeviceHostnames(function (err, deviceHostnames){
          if (deviceHostnames == null)
          {
            res.send(500);
          } else {
            var _ = require('underscore');
            var devices = _.values(deviceHostnames);
            res.type('application/json');
            res.send(JSON.stringify({ aaData: devices}));
          }
        });
    });


  app.get('/api/v1/ubersmith/devices/deviceid/:deviceid/tickets'
    , app.locals.requireGroup('users')
    , function (req, res) {
      app.locals.ubersmith.getTicketsbyDeviceID(req.params.deviceid
      , function (err, ticketList){
          if (err)
          {
            res.send(500);
          }  else {
            var _ = require('underscore');
            var tickets = _.values(ticketList);
            for (i=0; i<tickets.length; i++)
            {
              tickets[i].timestamp = app.locals.getFormattedTimestamp(tickets[i].timestamp);
              tickets[i].activity = app.locals.getFormattedTimestamp(tickets[i].activity);
            }
            res.type('application/json');
            res.send(JSON.stringify({aaData: tickets}));
          }
        });
    });

      app.get('/api/v1/ubersmith/devices/rack/:rack'
    , app.locals.requireGroup('users')
    , function (req, res) {
      app.locals.ubersmith.getDevicesByRack(req.params.rack
        , function (error, device) {
          if (error != null)
          {
            res.send(500);
          } else {
            if (device.dev && device.dev != null)
            {
              res.type('application/json');
              res.send(JSON.stringify({ aaData: [device] }));
            } else {
              res.send(500);
            }
          }
        })
    });

  app.get('/api/v1/ubersmith/devices/hostname/:hostname'
    , app.locals.requireGroup('users')
    , function (req, res) {
      app.locals.ubersmith.getDeviceByHostname(req.params.hostname
        , function (error, device) {
          if (error != null)
          {
            res.send(500);
          } else {
            if (device.dev && device.dev != null)
            {
              res.type('application/json');
              res.send(JSON.stringify({ aaData: [device] }));
            } else {
              res.send(500);
            }
          }
        })
    });

  app.get('/api/v1/ubersmith/devices/deviceid/:deviceid'
    , app.locals.requireGroup('users')
    , function (req, res) {
      app.locals.ubersmith.getDeviceByID(req.params.deviceid
        , function (error, device) {
          if (error != null)
          {
            res.send(500);
          } else {
            if (device.dev && device.dev != null)
            {
              res.type('application/json');
              res.send(JSON.stringify({ aaData: [device] }));
            } else {
              res.send(500);
            }
          }
        })
    });

  app.get('/api/v1/ubersmith/clients/clientid/:clientid'
    , app.locals.requireGroup('users')
    , function (req, res) {
      app.locals.ubersmith.getClientByID(req.params.clientid, function(err, client) {
        res.type('application/json');
        res.send(JSON.stringify(client));
      });
    });

  app.get('/api/v1/ubersmith/tickets'
    , app.locals.requireGroup('users')
    , function (req, res) {
      app.locals.ubersmith.getTickets(function(err, ticketList) {
        if (err)
        {
          res.send(500);
        }  else {
          var _ = require('underscore');
          var tickets = _.values(ticketList);
          for (i=0; i<tickets.length; i++)
          {
            tickets[i].timestamp = app.locals.getFormattedTimestamp(tickets[i].timestamp);
            tickets[i].activity = app.locals.getFormattedTimestamp(tickets[i].activity);
          }
          res.type('application/json');
          res.send(JSON.stringify({aaData: tickets}));
        }
      });
    });

  app.get('/api/v1/ubersmith/tickets/ticketid/:ticketid'
    , app.locals.requireGroup('users')
    , function (req, res) {
      app.locals.ubersmith.getTicketbyTicketID(req.params.ticketid, function(err, ticket) {
        if (err)
        {
          res.send(500);
        }  else {
          res.type('application/json');
          res.send(JSON.stringify(ticket));
        }
      });
    });

  app.post('/api/v1/ubersmith/tickets/ticketid/:ticketid/posts'
    , app.locals.requireGroup('users')
    , function (req, res) {
        var ticketID = req.params.ticketid;
        var subject = req.body.subject;
        var body = req.body.body;
        var visible = req.body.comment;
        var from = req.user.username + '@contegix.com';
        var time_spent = req.body.time_spent;

        app.locals.ubersmith.postItemToUbersmith('support.ticket_post_staff_response', {}, form, function (err, response) {
          if (error)
          {
            res.send(500);
          } else {

          }
        });
    });

  app.get('/api/v1/ubersmith/tickets/ticketid/:ticketid/posts'
    , app.locals.requireGroup('users')
    , function (req, res) {
      app.locals.ubersmith.getTicketPostsbyTicketID(req.params.ticketid, function(err, postsList) {
        if (err)
        {
          res.send(500);
        }  else {
          var _ = require('underscore');
          var posts = _.values(postsList);
          for (i=0; i<posts.length; i++)
          {
            posts[i].timestamp = app.locals.getFormattedTimestamp(posts[i].timestamp);
          }
          res.type('application/json');
          res.send(JSON.stringify({ aaData: posts }));
        }
      });
    });

  app.get('/api/v1/ubersmith/clients'
    , app.locals.requireGroup('users')
    , function (req, res) {
        app.locals.ubersmith.getClients(function(err, clientList) {
          if (err)
          {
            //res.send(500);
          } else {
            var _ = require('underscore');
            var clients = _.values(clientList);
            res.type('application/json');
            res.send(JSON.stringify({aaData: clients}));
          }
        });
    });

  app.get('/api/v1/ubersmith/clients/clientid/:clientid/tickets'
    , app.locals.requireGroup('users')
    , function (req, res) {
      app.locals.ubersmith.getTicketsbyClientID(req.params.clientid, function(err, ticketList) {
        if (err)
        {
          res.send(500);
        }  else {
          var _ = require('underscore');
          var tickets = _.values(ticketList);
          for (i=0; i<tickets.length; i++)
          {
            tickets[i].timestamp = app.locals.getFormattedTimestamp(tickets[i].timestamp);
            tickets[i].activity = app.locals.getFormattedTimestamp(tickets[i].activity);
          }
          res.type('application/json');
          res.send(JSON.stringify({aaData: tickets}));
        }
      });
    });

  app.get('/api/v1/ubersmith/clients/clientid/:clientid/devices'
    , app.locals.requireGroup('users')
    , function (req, res) {
      app.locals.ubersmith.getDevicesbyClientID(req.params.clientid, function(err, devicelist) {
        var _ = require('underscore');
        var devices = _.values(devicelist);
        res.type('application/json');
        res.send(JSON.stringify({ aaData: devices}));
      });
    });

  app.get('/api/v1/global/devices/deviceid/:deviceid'
    , app.locals.requireGroup('users')
    , function (req, res) {
      app.locals.ubersmith.getDeviceByID(req.params.deviceid
        , function (error, uberDevice) {
          if (error != null)
          {
            app.locals.logger.log('error', 'Failed to retrieve device from Ubersmith', { deviceid: req.params.deviceid });
            res.send(404);
          } else {
            var async = require('async');
            var hostname =  uberDevice.dev_desc + '.contegix.mgmt';
            async.parallel([
              function (asyncCallback) {
                app.locals.getPuppetDevice(hostname, asyncCallback);
              },
              function (asyncCallback) {
                app.locals.getSensuDevice(hostname, asyncCallback);
              }
            ], function(err, results) {
              if (err)
              {
                res.send(500);
              } else {
                if (results && results.length==2)
                {
                  var puppetDevice = results[0];
                  var sensuDevice = results[1];
                  res.type('application/json');
                  res.send(JSON.stringify({ ubersmith: uberDevice, sensu: sensuDevice, puppet: puppetDevice }));
                } else {
                  res.send(500);
                }
              }
            });
          }
        }
      );
    }
  );

  app.get('/api/v1/global/devices/hostname/:hostname'
    , app.locals.requireGroup('users')
    , function (req, res) {
      var async = require('async');
      var hostname =  req.params.hostname;
      async.parallel([
        function (asyncCallback) {
          app.locals.ubersmith.getDeviceByHostname(hostname, function (err, device){
            if (err)
            {
              asyncCallback(null, { error: 'No information is known about ' + hostname, device: {}});
            } else {
              asyncCallback(null, { device: device });
            }
          });
        },
        function (asyncCallback) {
          app.locals.getPuppetDevice(hostname, function (err, device){
            if (err)
            {
              asyncCallback(null, {});
            } else {
              asyncCallback(null, device);
            }
          });
        },
        function (asyncCallback) {
          app.locals.getSensuDevice(hostname, function (err, device){
            if (err)
            {
              asyncCallback(null, {});
            } else {
              asyncCallback(null, device);
            }
          });
        }
      ], function(err, results) {
        if (err)
        {
          res.send(500);
        } else {
          if (results && results.length==3)
          {
            var uberDevice = results[0];
            var puppetDevice = results[1];
            var sensuDevice = results[2];

            res.type('application/json');
            res.send(JSON.stringify({ ubersmith: uberDevice, sensu: sensuDevice, puppet: puppetDevice }));
          } else {
            res.send(500);
          }
        }
      });
    }
  );
}