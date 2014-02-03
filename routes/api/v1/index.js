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

  app.get('/api/v1/puppet/catalog/hostname/:hostname'
    , app.locals.requireGroup('users')
    , function (req, res) {
      var _ = require('underscore');
      var request = require('request');
      var hostname = req.params.hostname;
      request({ url: app.get('puppetdb_uri') + '/catalogs/' + req.params.hostname, json: true }
        , function (err, response, body) {
          if (err) {
            res.send(500);
          } else {
            res.type('application/json');
            res.send(body);
          }
        })
    });

  app.get('/api/v1/sensu/checks/hostname/:hostname'
    , app.locals.requireGroup('users')
    , function (req, res) {
      var _ = require('underscore');
      var request = require('request');
      var hostname = req.params.hostname;
      request({ url: app.get('puppetdb_uri') + '/catalogs/' + req.params.hostname, json: true }
        , function (err, response, body) {
          if (err) {
            res.send(500);
          } else {
            var catalog = body.data;
            var resourceList = catalog.resources;
            var checks = [];
            _.each(resourceList, function (resource) {
              if (_.contains(resource.tags, 'sensu::check') && resource.type == 'Sensu_check')
              {
                checks.push({title: resource.title, standalone: resource.parameters.standalone, subscribers: resource.parameters.subscribers, handlers: resource.parameters.handlers, interval: resource.parameters.interval, command: resource.parameters.command, parameters: resource.parameters});
              }
            });
            res.type('application/json');
            res.send(JSON.stringify({ aaData: checks }));
          }
        })
    });

  app.get('/api/v1/sensu/events'
    , app.locals.requireGroup('users')
    , function (req, res) {
    app.locals.getSensuEvents(function(err, events) {
      if (err) {
        res.send(500)
      } else {
        res.type('application/json');
        res.send(JSON.stringify({ aaData: events}))
      }
    });
  });

  app.get('/api/v1/sensu/events/hostname/:hostname'
    , app.locals.requireGroup('users')
    , function (req, res) {
      var _ = require('underscore');
      var request = require('request');
      app.locals.ubersmith.getDeviceHostnames(function (err, deviceHostnames){
        if (deviceHostnames == null)
        {
          res.send(500);
        } else {
          request({ url: app.get('sensu_uri') + '/events/' + req.params.hostname, json: true }, function (error, response, body) {
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

  app.get('/api/v1/sensu/events/filtered'
    , app.locals.requireGroup('users')
    , function (req, res) {
      async = require('async');
      var response = async.series({
        events: function(callback) {
          setTimeout(function() {
            app.locals.getSensuEvents(function(err, events) {
              if (!err) {
                callback(err, events);
              } else {
                callback(err, null);
              }
            })
          }, 60)},
        silenced: function(callback) {
          setTimeout(function() {
            app.locals.getSensuStashes('silence', function (err, stashes) {
              if (!err) {
                callback(err, stashes);
              } else {
                callback(err, null);
              }
            })
          }, 60)}
        }, function(err, results) {
          var silenced = results.silenced;
          var events = results.events;
          var silenced_hash = {};
          for (var i = 0; i < silenced.length; i++) {
            var split_path = silenced[i].path.split('/');
            if (!(split_path[1] in silenced_hash)) {
              silenced_hash[split_path[1]] = [ ];
            }
            if (split_path[2] == null) {
              silenced_hash[split_path[1]] = [ 0 ];
            } else if (split_path[2] != null && silenced_hash[split_path[1]][0] != 0) {
              silenced_hash[split_path[1]].push(split_path[2])
            }
          }
          var filtered_events = [];
          for (var i = 0; i < events.length; i++) {
            var element = events[i];
            if (element['client'] in silenced_hash && (silenced_hash[element['client']][0] == 0 || silenced_hash[element['client']].indexOf(element['check']) != -1)) {
              element['silenced'] = 1;
              var client = element['client'];
              var check;
              if (silenced_hash[element['client']].indexOf(element['check']) != -1) {
                check = '/' + element['check'];
              } else {
                check = '';
              }
              element['silence_stash'] = client + check;
            } else {
              element['silenced'] = 0;
              element['silence_stash'] = '';
            }
            filtered_events.push(element)
          }
          res.type('application/json');
          res.send(JSON.stringify({ aaData: filtered_events }));
        });
    });

  app.get('/api/v1/sensu/events/device/:device'
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
      app.locals.silenceClient(req.user.username, req.params.client, parseInt(req.body.expires)
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
      app.locals.silenceCheck(req.user.username, req.params.client, req.params.check, parseInt(req.body.expires)
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

  app.get('/api/v1/sensu/devices'
    , app.locals.requireGroup('users')
    , function (req, res) {
      app.locals.ubersmith.getDeviceHostnames(function (err, deviceHostnames){
        if (deviceHostnames == null)
        {
          res.send(500);
        } else {
          var _ = require('underscore');
          var request = require('request');
          request({ url: app.get('sensu_uri')  + '/events', json:true}
            , function (error, response) {
              if (error) {
                res.send(500);
              } else {
                var eventList = response.body;
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
                        /*var events = [];
                        device.timestamp = app.locals.getFormattedTimestamp(device.timestamp);
                        _.each(eventList, function (event) {
                          if (device.name == event.client)
                          {
                            events.push(event);
                          }
                        });*/
                        //var events =  _.where(eventList, {client: device.name});
                        //_.defaults(device, {events: events, event_count: events.length });
                        deviceList.push(eventList);
                      });
                      res.type('application/json');
                      res.send(JSON.stringify({aaData: deviceList}));
                    }
                  });
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
        var visible = req.body.comment;
        var from = req.user.username + '@contegix.com';
        var time_spent = req.body.time_spent;
        var sensuEvent = JSON.parse(decodeURI(req.body.sensuEvent));
        var documentation = req.body.documentation;

        var msgBody = "Monitoring Event added to Ticket:\n";
        msgBody += "Output: \n\n" + sensuEvent.output + "\n\n\n";
        msgBody += "Status: " + sensuEvent.status + "\nIssued: " + sensuEvent.issued + "\n";
        msgBody += "Flapping: " + sensuEvent.flapping + "\n";
        msgBody += "Location: " + sensuEvent.location + "\n";
        msgBody += "Device: " + sensuEvent.dev_desc;
        msgBody += "\n\n\n";
        msgBody += "Additional Documentation: \n";
        msgBody += documentation;
        msgBody = encodeURI(msgBody);

        var form = 'ticket_id=' + ticketID + '&subject=' + encodeURI(subject) + '&body=' + msgBody + '&visible=' + visible + '&from=' + from + '&time_spent=' + time_spent;

        app.locals.ubersmith.postItemToUbersmith('support.ticket_post_staff_response', '&' + form, form, function (err, response) {
          if (err)
          {
            res.send(500);
          } else {
            res.send(JSON.stringify(response));
          }
        });
    });

  app.post('/api/v1/ubersmith/tickets/ticket'
    , app.locals.requireGroup('users')
    , function (req, res) {
      var subject = req.body.subject;
      var msgBody = req.body.msgBody;
      var recipient = req.body.recipient;
      var author = req.user.username + '@contegix.com';
      var priority = req.body.priority;
      var client_id = req.body.clientID;
      var device_id = req.body.deviceID;
      var timestamp = Date.now();

      msgBody += "\n";
      msgBody += "Contegix | Technical Support\n";
      msgBody += "(314) 622-6200 ext. 3\n";
      msgBody += "https://portal.contegix.com\n";
      msgBody += "http://status.contegix.com\n";
      msgBody += "Twitter: @contegix | http://twitter.com/contegix\n";
      msgBody += "Twitter: @contegixstatus | http://twitter.com/contegixstatus\n";

      var form = 'subject=' + encodeURI(subject) + '&body=' + encodeURI(msgBody) + '&author=' + author + '&priority=' + priority
        form += '&recipient=' + recipient + '&client_id=' + client_id + '&device_id=' + '&timestamp=' + timestamp;

      app.locals.ubersmith.postItemToUbersmith('support.ticket_submit_outgoing', '&' + form, form, function (err, response) {
        if (err)
        {
          res.send(500);
        } else {
          res.send(JSON.stringify(response));
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
