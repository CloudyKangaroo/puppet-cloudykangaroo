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

  app.get('/api/v1/puppet/metrics/population'
    , app.locals.requireGroup('users')
    , function (req, res) {

      var request = require('request');
      var async = require('async');

      var getNumNodes = function(callback)
      {
        var URL = app.get('puppetdb_uri') + '/metrics/mbean/com.puppetlabs.puppetdb.query.population%3Atype%3Ddefault%2Cname%3Dnum-nodes';
        request({ url: URL, json: true }, function (error, response, body) {
          if (error || !body.Value)
          {
            callback(error, 0);
          } else {
            callback(error, body.Value);
          }
        });
      };
      var getNumResources = function(callback)
      {
        var URL = app.get('puppetdb_uri') + '/metrics/mbean/com.puppetlabs.puppetdb.query.population%3Atype%3Ddefault%2Cname%3Dnum-resources';
        request({ url: URL, json: true }, function (error, response, body) {
          if (error || !body.Value)
          {
            callback(error, 0);
          } else {
            callback(error, body.Value);
          }
        });
      };
      var getResourceDupes = function(callback)
      {
        var URL = app.get('puppetdb_uri') + '/metrics/mbean/com.puppetlabs.puppetdb.query.population%3Atype%3Ddefault%2Cname%3Dpct-resource-dupes';
        request({ url: URL, json: true }, function (error, response, body) {
          if (error || !body.Value)
          {
            callback(error, 0);
          } else {
            callback(error, body.Value);
          }
        });
      };
      var getResourcesPerNode = function(callback)
      {
        var URL = app.get('puppetdb_uri') + '/metrics/mbean/com.puppetlabs.puppetdb.query.population%3Atype%3Ddefault%2Cname%3Davg-resources-per-node';
        request({ url: URL, json: true }, function (error, response, body) {
          if (error || !body.Value)
          {
            callback(error, 0);
          } else {
            callback(error, body.Value);
          }
        });
      };

      async.parallel([
        getNumNodes,
        getNumResources,
        getResourceDupes,
        getResourcesPerNode
      ], function(error, results) {
        if (error)
        {
          res.send(500);
        } else {
          var response = {numNodes: results[0], numResources: results[1], resourceDupes: results[2], resourcesPerNode: results[3]};
          res.type('application/json');
          res.send(response);
        }
      });

     // res.type('application/json');
     // res.send({numNodes: 657, numResources: 50673, resourceDupes: 100, resourcesPerNode: 77.12785388127854});
    });

  app.get('/api/v1/puppet/aggregate_event_counts/hours/:hours'
    , app.locals.requireGroup('users')
    , function (req, res) {
      var hoursAgo = req.params.hours;
      var request = require('request');
      var queryString = '?query=[">", "timestamp", "' + moment().subtract('hours', hoursAgo).format() + '"]';
      queryString += '&summarize-by=certname';
      var URL = app.get('puppetdb_uri') + '/aggregate-event-counts' + queryString;

      request({ url: URL, json: true }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          app.locals.logger.log('debug', 'fetched data from PuppetDB', { uri: URL});
          res.type('application/json');
          res.send(body);
        } else {
          app.locals.logger.log('error', 'Error processing request', { error: error, uri: URL})
          res.send(500);
        }
      })
    });

  app.get('/api/v1/puppet/aggregate_event_counts/hours/:hours'
    , app.locals.requireGroup('users')
    , function (req, res) {

      var hoursAgo = req.params.hours;
      var request = require('request');
      var queryString = '?query=["and", ["~", "certname", ".*"],[">", "timestamp", "' + moment().subtract('hours', hoursAgo).format() + '"]]';
      queryString += '&summarize-by=certname';
      var URL = app.get('puppetdb_uri') + '/aggregate-event-counts' + queryString;

      request({ url: URL, json: true }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          app.locals.logger.log('debug', 'fetched data from PuppetDB', { uri: URL});
          res.type('application/json');
          res.send(body);
        } else {
          app.locals.logger.log('error', 'Error processing request', { error: error, uri: URL})
          res.send(500);
        }
      })

      /*res.type('application/json');
      res.send({
        "successes" : 695,
        "failures" : 577,
        "noops" : 0,
        "skips" : 194,
        "total" : 695
      });*/
    });

  app.get('/api/v1/puppet/failures/hours/:hours'
    , app.locals.requireGroup('users')
    , function (req, res) {
      var hoursAgo = req.params.hours;
      var request = require('request');
      var queryString = '?query=["and", ["=", "status", "failure"], ["~", "certname", "contegix.mgmt$"],[">", "timestamp", "' + moment().subtract('hours', hoursAgo).format() + '"]]';
      var URL = app.get('puppetdb_uri') + '/events' + queryString;

      request({ url: URL, json: true }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          app.locals.logger.log('debug', 'fetched data from PuppetDB', { uri: URL});
          res.type('application/json');
          res.send({ aaData: body});
        } else {
          app.locals.logger.log('error', 'Error processing request', { error: error, uri: URL})
          res.send(500);
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
      var url = app.get('puppetdb_uri') + '/catalogs/' + hostname;
      app.locals.logger.log('debug', 'Requesting data from Puppet', {url: url})
      request({ url: url, json: true }
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
      var url = app.get('puppetdb_uri') + '/catalogs/' + hostname;
      app.locals.logger.log('debug', 'Requesting data from Puppet', {url: url});
      request({ url: url, json: true }
        , function (err, response, body) {
          if (err) {
            res.send(500);
          } else {
            if (body.data) {
              var catalog = body.data;
              var resourceList = catalog.resources;
              var checks = [];
              _.each(resourceList, function (resource) {
                if (_.contains(resource.tags, 'sensu::check') && resource.type == 'Sensu::Check' && resource.title != 'ping_' + hostname)
                {
                  var check = {title: resource.title, occurrences: resource.parameters.occurrences, standalone: resource.parameters.standalone, subscribers: resource.parameters.subscribers, handlers: resource.parameters.handlers, interval: resource.parameters.interval, command: resource.parameters.command, parameters: resource.parameters};
                  checks.push(_.defaults(check, {command: '', handlers: [], occurrences: 0, interval: 0}));
                }
              });
              res.type('application/json');
              res.send(JSON.stringify({ aaData: checks }));
            } else {
              if (body.error && body.error == 'Could not find catalog for ' + hostname) {
                res.send(404);
              } else {
                res.send(500);
              }
            }
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
      var hostname = req.params.hostname;
      app.locals.getSensuDeviceEvents(hostname, function (err, events) {
         if (err) {
           app.locals.logger.log('error', 'Error handling request', {message: err.message});
           res.send(500);
         } else {
           res.type('application/json');
           res.send(JSON.stringify({ aaData: events }));
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

  app.get('/api/v1/sensu/stashes'
    , app.locals.requireGroup('users')
    , function (req, res) {
      var _ = require('underscore');
      app.locals.getSensuStashes('.*'
        , function (err, response) {
          if (err) {
            res.send(500);
          } else {
            var retStashes = [];
            var stashList = response;
            _.each(stashList, function(stash) {
              retStashes.push({path: stash.path, content: JSON.stringify(stash.content), expire: stash.expire});
            });
            res.type('application/json');
            res.send({aaData: retStashes});
          }
        })
    });

  // SILENCE a CLIENT
  app.post('/api/v1/sensu/silence/client/:client'
    , app.locals.requireGroup('users')
    , function (req, res) {
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
  // GET ALL DEVICES
  app.get('/api/v1/sensu/devices'
    , app.locals.requireGroup('users')
    , function (req, res) {
      app.locals.crmModule.getDeviceHostnames(function (err, deviceHostnames){
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
                        deviceList.push(device);
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
      app.locals.crmModule.getDevicesbyTypeGroupID(req.params.devgroupid
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

  app.get('/api/v1/ubersmith/devices/devgroups'
    , app.locals.requireGroup('users')
    , function (req, res) {
      app.locals.crmModule.getDeviceTypeList(
        function (err, deviceGroupList){
          if (deviceGroupList == null)
          {
            res.send(500);
          } else {
            var _ = require('underscore');
            var deviceGroups = _.values(deviceGroupList);
            var returnList = [];
            _.each(deviceGroups, function(group) {
              returnList.push(_.pick(group, ['devtype_group_id', 'name', 'priority']));
            });

            res.type('application/json');
            res.send(JSON.stringify(returnList));
          }
        });
    });

  app.get('/api/v1/ubersmith/devices/hostname'
    , app.locals.requireGroup('users')
    , function (req, res) {
        app.locals.crmModule.getDeviceHostnames(function (err, deviceHostnames){
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
      app.locals.crmModule.getTicketsbyDeviceID(req.params.deviceid
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
      app.locals.crmModule.getDevicesByRack(req.params.rack
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
      app.locals.crmModule.getDeviceByHostname(req.params.hostname
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
      app.locals.crmModule.getDeviceByID(req.params.deviceid
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

  app.get('/api/v1/ubersmith/contacts/search'
    , app.locals.requireGroup('users')
    , function (req, res) {
        var results = [];
        var query = req.query.q;
        app.locals.logger.log('debug', 'Search Query', {query: query});
        results.push({"id":"1", "name":"jonathan.creasy@contegix.com"});
        results.push({"id":"2", "name":"richard.chatterton@contegix.com"});
        res.type('application/json');
        res.send(results);
    });

  app.get('/api/v1/ubersmith/clients'
    , app.locals.requireGroup('users')
    , function (req, res) {
      app.locals.crmModule.getClients(function(err, clientList) {
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

  app.get('/api/v1/ubersmith/clients/clientid/:clientid'
    , app.locals.requireGroup('users')
    , function (req, res) {
      var clientID = req.params.clientid;
      app.locals.crmModule.getClientByID(clientID, function(err, client) {
        res.type('application/json');
        res.send(JSON.stringify(client));
      });
    });

  app.get('/api/v1/ubersmith/clients/clientid/:clientid/contacts'
    , app.locals.requireGroup('users')
    , function (req, res) {
      var clientID = req.params.clientid;
      app.locals.crmModule.getContactsbyClientID(clientID, function(err, contactList) {
        var _ = require('underscore');
        var contacts = _.values(contactList);
        res.type('application/json');
        res.send(JSON.stringify(contacts));
      });
    });

  app.get('/api/v1/ubersmith/clients/clientid/:clientid/devices'
    , app.locals.requireGroup('users')
    , function (req, res) {
      app.locals.crmModule.getDevicesbyClientID(req.params.clientid, function(err, devicelist) {
        var _ = require('underscore');
        var devices = _.values(devicelist);
        res.type('application/json');
        res.send(JSON.stringify({ aaData: devices}));
      });
    });

  app.get('/api/v1/ubersmith/clients/clientid/:clientid/tickets'
    , app.locals.requireGroup('users')
    , function (req, res) {
      app.locals.crmModule.getTicketsbyClientID(req.params.clientid, function(err, ticketList) {
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

  app.get('/api/v1/ubersmith/api/methods'
    , app.locals.requireGroup('users')
    , function (req, res) {
      app.locals.crmModule.getAPIMethods(function(err, client) {
        res.type('application/json');
        res.send(JSON.stringify(client));
      });
    });

  app.get('/api/v1/ubersmith/tickets'
    , app.locals.requireGroup('users')
    , function (req, res) {
      app.locals.crmModule.getTickets(function(err, ticketList) {
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
      app.locals.crmModule.getTicketbyTicketID(req.params.ticketid, function(err, ticket) {
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
        var visible = req.body.comment || 0;
        var from = req.user.email;
        var time_spent = req.body.time_spent || 1;
        var documentation = req.body.documentation || '';
        var sensuEventData = req.body.sensuEvent || '';
        var checkString = "Created Ticket from Monitoring Event:\n";

        if (sensuEventData != '')
        {
          var eventJSON = decodeURI(sensuEventData);
          var sensuEvent = JSON.parse(eventJSON);
          checkString += "Check Output:\n--------------------------------------\n" + sensuEvent.output + "\n--------------------------------------\n";
          checkString += "Status: " + sensuEvent.status + "\nIssued: " + sensuEvent.issued + "\n";
          checkString += "Flapping: " + sensuEvent.flapping + "\n";
          checkString += "Location: " + sensuEvent.location + "\n";
          checkString += "Device: " + sensuEvent.dev_desc;
          checkString += "\n\n";
        }

        var msgBody = checkString;
        msgBody += "Additional Documentation: \n";
        msgBody += documentation;
        msgBody += "\n\n";
        msgBody += app.locals.config.support.signatureTemplate;


      app.locals.crmModule.addPostToTicket(ticketID, subject, msgBody, visible, from, time_spent, function (err, response) {
          if (err)
          {
            if (err.code == 'ETIMEDOUT')
            {
              res.send(504);
            } else {
              res.send(500);
            }
          } else {
            res.send(JSON.stringify(response));
          }
        });
    });

  app.post('/api/v1/ubersmith/tickets/ticket'
    , app.locals.requireGroup('users')
    , function (req, res) {
      var clientID = req.body.clientID;

      app.locals.crmModule.getAdminByEmail(req.user.email, function (err, adminList) {
        if (err) {
          res.send(500);
        } else {
          var _ = require('underscore');
          adminList = _.values(adminList);

          _.each(adminList, function(admin) {
             if (admin.email == req.user.email) {
                req.user.adminID = admin.id;
             }
          });

          if (!req.user.adminID) {
            req.user.adminID = 0;
          }

          app.locals.crmModule.getContactsbyClientID(clientID, function (err, contactList) {
            if (err) {
              res.send(500);
            } else {
              var toList = [];
              var ccList = [];
              var contactList = _.values(contactList);
              _.each(contactList, function(contact) {
                if (contact.access) {
                   var access = contact.access;
                   if (access['submit_new_ticket'] && access['submit_new_ticket'] == 'edit')
                   {
                     toList.push(contact.email);
                   } else if (access['submit_new_ticket']) {
                     ccList.push(contact.email);
                   }
                }
              });
              req.body.ccList = ccList;
              req.body.toList = toList;
              createSupportTicket(req, res);
            }
          });
        }
      })
    });

  function createSupportTicket(req, res) {
    var subject = req.body.subject;
    var recipient = req.body.recipient;
    var user_id = req.user.adminID;
    var author = req.user.email;
    var ccList = req.body.ccList;
    var toList = req.body.toList;
    var priority = req.body.priority || 1;
    var clientID = req.body.clientID || 0;
    var contactID = req.body.contactID || 0;
    var deviceID = req.body.deviceID || 0;
    var documentation = req.body.documentation || '';
    var sensuEventData = req.body.sensuEvent || '';

    if (sensuEventData != '')
    {
      var eventJSON = decodeURI(sensuEventData);
      var sensuEvent = JSON.parse(eventJSON);
      var checkString = "Created Ticket from Monitoring Event:\n";
      checkString += "Check Output:\n--------------------------------------\n" + sensuEvent.output + "\n--------------------------------------\n";
      checkString += "Status: " + sensuEvent.status + "\nIssued: " + sensuEvent.issued + "\n";
      checkString += "Flapping: " + sensuEvent.flapping + "\n";
      checkString += "Location: " + sensuEvent.location + "\n";
      checkString += "Device: " + sensuEvent.dev_desc;
      checkString += "\n\n";
    }

    var documentation = req.body.documentation;

    var msgBody = checkString;
    msgBody += "Additional Documentation: \n";
    msgBody += documentation;
    msgBody += "\n\n";
    msgBody += app.locals.config.support.signatureTemplate;

    app.locals.crmModule.createNewTicket(msgBody, subject, recipient, user_id, author, ccList, toList, priority, clientID, contactID, deviceID, function (err, response) {
      if (err)
      {
        if (err.code == 'ETIMEDOUT')
        {
          res.send(504);
        } else {
          res.send(500);
        }
      } else {
        res.send(JSON.stringify(response));
      }
    });
  };

  app.get('/api/v1/ubersmith/tickets/ticketid/:ticketid/posts'
    , app.locals.requireGroup('users')
    , function (req, res) {
      app.locals.crmModule.getTicketPostsbyTicketID(req.params.ticketid, function(err, postsList) {
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

  app.get('/api/v1/global/devices/deviceid/:deviceid'
    , app.locals.requireGroup('users')
    , function (req, res) {
      app.locals.crmModule.getDeviceByID(req.params.deviceid
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
          app.locals.crmModule.getDeviceByHostname(hostname, function (err, device){
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
