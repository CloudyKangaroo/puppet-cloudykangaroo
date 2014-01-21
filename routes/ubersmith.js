module.exports = function (app, config, passport, redisClient) {
  var async = require('async');
  var request = require('request')

  app.get('/ubersmith'
    , app.locals.ensureAuthenticated
    , function (req, res) {

      redisClient.mget(['support.ticket_count.low', 'support.ticket_count.normal', 'support.ticket_count.high', 'support.ticket_count.urgent', 'support.ticket_count.total', 'uber.event_list', 'support.ticket_count'], function(err, reply){
        if (!reply) {
          app.locals.logger.log('error', 'redis mget error', { err: err});
          res.send(500);
        } else {
          //app.locals.logger.log('debug', 'redis mget reply', { reply: reply });
          var ticketLow = reply[0].replace(/"/g,'');
          var ticketNormal = reply[1].replace(/"/g,'');
          var ticketHigh = reply[2].replace(/"/g,'');
          var ticketUrgent = reply[3].replace(/"/g,'');
          var ticketTotal = reply[4].replace(/"/g,'');
          var eventList = reply[5];
          res.render('ubersmith', {ticket_count: { low: ticketLow, normal: ticketNormal, high: ticketHigh, urgent: ticketUrgent, total: ticketTotal}, event_list: eventList, user: req.user, section: 'dashboard', navLinks: config.navLinks.ubersmith });
        }
      });
    });

  app.get('/ubersmith/tickets'
    , app.locals.ensureAuthenticated
    , function (req, res) {
      redisClient.mget(['support.ticket_count.low', 'support.ticket_count.normal', 'support.ticket_count.high', 'support.ticket_count.urgent', 'support.ticket_count.total'], function(err, reply){
        if (!reply) {
          app.locals.logger.log('error', 'redis mget error', { err: err});
          res.send(500);
        } else {
          //app.locals.logger.log('debug', 'redis mget reply', { reply: reply });
          var ticketLow = reply[0].replace(/"/g,'');
          var ticketNormal = reply[1].replace(/"/g,'');
          var ticketHigh = reply[2].replace(/"/g,'');
          var ticketUrgent = reply[3].replace(/"/g,'');
          var ticketTotal = reply[4].replace(/"/g,'');
          res.render('ubersmith/tickets', {ticket_count: { low: ticketLow, normal: ticketNormal, high: ticketHigh, urgent: ticketUrgent, total: ticketTotal}, user: req.user, section: 'tickets', navLinks: config.navLinks.ubersmith });
        }
      });
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
        case 'device.type_list':
        case 'support.ticket_count':
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
        case 'support.ticket_list':
          redisClient.get(key.toLowerCase(), function (err, reply) {
            if (!reply) {
              res.send(500);
            } else {
              var tickets = Array();
              var ticketList = JSON.parse(reply);
              Object.keys(ticketList).forEach(
                function (ticketID) {
                  var uberTicket = ticketList[ticketID];
                  if (uberTicket.type.indexOf("Closed") == -1)
                  {
                    uberTicket.client_activity = app.locals.getFormattedTimestamp(uberTicket.client_activity)
                    uberTicket.timestamp = app.locals.getFormattedTimestamp(uberTicket.timestamp)
                    uberTicket.activity = app.locals.getFormattedTimestamp(uberTicket.activity)
                    uberTicket.admin_initial_response = app.locals.getFormattedTimestamp(uberTicket.admin_initial_response)
                    var filteredTicket = { priority: uberTicket.priority, type: uberTicket.type, timestamp: uberTicket.timestamp, activity: uberTicket.activity, activity_type: uberTicket.activity_type, client_id: uberTicket.client_id, listed_company: uberTicket.listed_company, q_name: uberTicket.q_name, admin_username: uberTicket.admin_username, subject: uberTicket.subject, device_id: uberTicket.device_id }
                    tickets.push(filteredTicket);
                  }
                });
              res.type('application/json');
              res.send({ aaData: tickets });
            }
          });
          break;
        case 'uber.event_list':
          redisClient.get(key.toLowerCase(), function (err, reply) {
            if (!reply) {
              res.send(500);
            } else {
              var events = Array();
              var eventList = JSON.parse(reply);
              Object.keys(eventList).forEach(
                function (eventID) {
                  var uberEvent = eventList[eventID];
                  uberEvent.time = app.locals.getFormattedTimestamp(uberEvent.time)
                  events.push(uberEvent);
                });
              res.type('application/json');
              res.send({ aaData: events });
            }
          });
          break;
        default:
          res.send(400);
          break;
      }
    });
  app.get('/ubersmith/devices/location/rack/:rack'
    , app.locals.requireGroup('users')
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
    , app.locals.requireGroup('users')
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
    , app.locals.requireGroup('users')
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
    , app.locals.requireGroup('users')
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
    , app.locals.requireGroup('users')
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
    , app.locals.requireGroup('users')
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
    , app.locals.requireGroup('users')
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
    , app.locals.requireGroup('users')
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
    , app.locals.requireGroup('users')
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
                      request({ url: app.get('puppetdb_uri') + '/nodes/' + uberDevice.dev_desc + '.contegix.mgmt', json: true }
                        , function (error, response, body) {
                          if (error)
                          {
                            app.locals.logger.log('debug', 'failed to get data from PuppetDB', { uri: app.get('puppetdb_uri') + '/nodes/' + uberDevice.dev_desc + '.contegix.mgmt'});
                            res.send(500);
                          } else {
                            var puppetInfo = body;
                            request({ url: app.get('puppetdb_uri') + '/nodes/' + uberDevice.dev_desc + '.contegix.mgmt/facts', json: true }
                              , function (error, response, body) {
                                if (error)
                                {
                                  app.locals.logger.log('debug', 'failed to get data from PuppetDB', { uri: app.get('puppetdb_uri') + '/nodes/' + uberDevice.dev_desc + '.contegix.mgmt/facts'});
                                  res.send(500);
                                } else {
                                  var facts = body;
                                  //app.locals.logger.log('debug', 'starting facts', { facts: JSON.stringify(facts) });
                                  puppetInfo.facts = {};
                                  for (i=0; i<facts.length; i++)
                                  {
                                    puppetInfo.facts[facts[i].name] = facts[i].value;
                                  }
                                  //app.locals.logger.log('debug', 'converted facts', { facts: JSON.stringify(puppetInfo.facts) });

                                  res.render('ubersmith/device', { puppetInfo: puppetInfo, uberDevice: uberDevice, sensuClient: sensuClient, sensuEvents: sensuEvents, user:req.user, section: 'devices', navLinks: config.navLinks.ubersmith });
                                }
                              });
                          }
                        });
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
    , app.locals.requireGroup('users')
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
          res.redirect('/ubersmith/devices/deviceid/' + uberDevice.dev);
        }
      });
    });

  app.get('/ubersmith/devices/clientid/:clientid'
    , app.locals.requireGroup('users')
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
    , app.locals.requireGroup('users')
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
              filteredDevice = { 'device': device.dev, 'type': device.type, 'desc': device.dev_desc, 'clientid': device.clientid, 'company': device.company, 'location': device.location, 'status': device.device_status};
              aReturn.push(filteredDevice);
              //aReturn.push(device);
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

  app.get('/ubersmith/devices/list/deviceid/:device_id/tickets'
    , app.locals.requireGroup('users')
    , function (req, res) {
      redisClient.smembers('devices:deviceid:' + req.params.device_id + ':tickets', function (err, reply) {
        if (!reply) {
          res.send(500);
        } else {
          var tickets = parseRedisSet(reply);
          for (i=0; i<tickets.length; i++)
          {
            tickets[i].timestamp = app.locals.getFormattedTimestamp(tickets[i].timestamp);
            tickets[i].activity = app.locals.getFormattedTimestamp(tickets[i].activity);
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.write(JSON.stringify({ aaData: tickets}));
          res.end();
        }
      });
    });

  app.get('/ubersmith/exceptions'
    , app.locals.requireGroup('users')
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

  // Ubersmith Customer Browser
  app.get('/ubersmith/clients'
    , app.locals.requireGroup('users')
    , function (req, res) {
      res.render('ubersmith/clients', { user:req.user, section: 'clients', navLinks: config.navLinks.ubersmith });
    });

  app.get('/ubersmith/clients/copmany/:company'
    , app.locals.requireGroup('users')
    , function (req, res) {
      redisClient.get('client.list', function (err, reply) {
        if (!reply)
        {
          res.send(500);
        } else {
          var clientList = JSON.parse(reply);
          var client = clientList[req.params.clientid];
          redisClient.get('device.list.clientid', function(err, reply) {
            var deviceList = JSON.parse(reply);
            var devices = deviceList[req.params.clientid];
            //res.writeHead(200, { 'Content-Type': 'application/json' });
            //res.write(JSON.stringify({deviceList: devices, client: client}));
            //res.end();
            res.render('ubersmith/client', { devices: devices, client: client, user:req.user, section: 'clients', navLinks: config.navLinks.ubersmith });
          });
        }
      });
    });

  app.get('/ubersmith/clients/clientid/:clientid'
    , app.locals.requireGroup('users')
    , function (req, res) {
      var _ = require('underscore');
      redisClient.get('client.list', function (err, reply) {
        if (!reply)
        {
          res.send(500);
        } else {
          var clientList = JSON.parse(reply);
          var client = clientList[req.params.clientid];
          redisClient.smembers('devices:clientid:' + req.params.clientid, function (err, reply) {
            var devices = new Array();
            for (i=0; i<=reply.length;i++)
            {
              if (reply[i] != 'undefined')
              {
                try {
                  var device = reply[i];
                  devices.push(JSON.parse(reply[i]));
                } catch (e) {
                  app.locals.logger.log('debug', 'Tried to parse invalid JSON: "' + e.message + '"', { json: reply[i]});
                }
              }
            }
            redisClient.get('client.contact_list_' + req.params.clientid, function (err, reply) {
              client.contacts = new Array();
              if (reply)
              {
                var contacts = JSON.parse(reply);
                Object.keys(contacts).forEach(function(contactID)
                {
                  var contact = contacts[contactID];
                  if (contact.active == 1)
                  {
                    var filteredContact = _.pick(contact, 'billing_role', 'sales_role', 'dc_access_role', 'real_name', 'email_name', 'email_domain', 'login', 'phone', 'email');
                    client.contacts.push(filteredContact);
                  }
                });
              }
              res.render('ubersmith/client', { clientid: req.params.clientid, devices: devices, client: client, user:req.user, section: 'clients', navLinks: config.navLinks.ubersmith });
            });
          });
        }
      });
    });

  app.get('/ubersmith/clients/list/company/:company/devices'
    , app.locals.requireGroup('users')
    , function (req, res) {
      redisClient.get('device.list.company', function (err, reply) {
        if (!reply)
        {
          res.send(500);
        } else {
          var deviceListByCompany = JSON.parse(reply);
          var deviceList = deviceListByCompany[req.params.company];
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.write(JSON.stringify(deviceList));
          res.end();
        }
      })
    });

  app.get('/ubersmith/clients/list/clientid/:clientid'
    , app.locals.requireGroup('users')
    , function (req, res) {
      var _ = require('underscore');
      redisClient.get('client.list', function (err, reply) {
        if (!reply)
        {
          res.send(500);
        } else {
          var clientList = JSON.parse(reply);
          var client = clientList[req.params.clientid];
          redisClient.get('client.contact_list_' + req.params.clientid, function (err, reply) {
            client.contacts = new Array();
            if (reply)
            {
              var contacts = JSON.parse(reply);
              Object.keys(contacts).forEach(function(contactID)
              {
                var contact = contacts[contactID];
                var filteredContact = _.pick(contact, 'real_name', 'email_name', 'email_domain', 'login', 'phone', 'email');
                client.contacts.push(filteredContact);
              });
            }
            var filteredClient = _.pick(client, 'clientid', 'full_name', 'company', 'email', 'phone', 'salesperson', 'contacts');
            if (filteredClient.full_name == '')
            {
              filteredClient.full_name = client.first + ' ' + client.last;
            }
            res.type('application/json');
            res.send(JSON.stringify(filteredClient));
          });

        }
      });
    });

  app.get('/ubersmith/clients/list/clientid/:clientid/tickets'
    , app.locals.requireGroup('users')
    , function (req, res) {
      redisClient.smembers('client:' + req.params.clientid + ':tickets', function (err, reply) {
        if (!reply) {
          res.send(500);
        } else {
          var tickets = parseRedisSet(reply);
          for (i=0; i<tickets.length; i++)
          {
            tickets[i].timestamp = app.locals.getFormattedTimestamp(tickets[i].timestamp);
            tickets[i].activity = app.locals.getFormattedTimestamp(tickets[i].activity);
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.write(JSON.stringify({ aaData: tickets}));
          res.end();
          /*var ticketList = JSON.parse(reply);
          Object.keys(ticketList).forEach(
            function (ticketID) {
              var uberTicket = ticketList[ticketID];
              if (uberTicket.type.indexOf("Closed") == -1 && uberTicket.client_id == req.params.clientid)
              {
                uberTicket.client_activity = app.locals.getFormattedTimestamp(uberTicket.client_activity)
                uberTicket.timestamp = app.locals.getFormattedTimestamp(uberTicket.timestamp)
                uberTicket.activity = app.locals.getFormattedTimestamp(uberTicket.activity)
                uberTicket.admin_initial_response = app.locals.getFormattedTimestamp(uberTicket.admin_initial_response)
                var filteredTicket = { priority: uberTicket.priority, type: uberTicket.type, timestamp: uberTicket.timestamp, activity: uberTicket.activity, activity_type: uberTicket.activity_type, client_id: uberTicket.client_id, listed_company: uberTicket.listed_company, q_name: uberTicket.q_name, admin_username: uberTicket.admin_username, subject: uberTicket.subject, device_id: uberTicket.device_id }
                tickets.push(filteredTicket);
              }
            });
          res.type('application/json');
          res.send({ aaData: tickets });*/
        }
      });
    });

  app.get('/ubersmith/clients/list/clientid/:clientid/devices'
    , app.locals.requireGroup('users')
    , function (req, res) {
      var clientid = req.params.clientid;
      redisClient.smembers('devices:clientid:' + clientid, function (err, reply) {
        if (!reply) {
          app.locals.logger.log('error', 'could not retrieve host: ' + 'devices:hostname:' + hostname, {});
          res.send(500);
        } else {
          var devices = parseRedisSet(reply);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.write(JSON.stringify({ aaData: devices}));
          res.end();
        }
      });
    });

  // Used by Customer Browser, returns table data
  app.get('/ubersmith/clients/list'
    , app.locals.requireGroup('users')
    , function (req, res) {
      var aReturn = Array();
      var foundSome = false;
      var filteredDevice = {};
      var aSyncRequests = new Array();
      var _ = require('underscore');

      redisClient.get('client.list', function (err, reply) {
        if (!reply) {
          res.send(500);
        } else {
          var clientList= JSON.parse(reply);
          Object.keys(clientList).forEach(function(clientid) {
            if (clientList[clientid].company != 'REMOVED' && clientList[clientid].active == 1) {
              aSyncRequests.push(
                function (callback) {
                  //app.locals.logger.log('debug', 'requesting client id ' + clientid, {});
                  redisClient.get('client.contact_list_' + clientid
                    , function (error, response) {
                      if (error)
                      {
                        callback(error, { response: response, type: 'error', clientid: clientid});
                      } else {
                        callback(error, { response: JSON.parse(response), type: 'contact_list', clientid: clientid});
                      }
                    }
                  );
                }
              );
            }
          });
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
                    default:
                      if (result.clientid in clientList && result.response)
                      {
                        //app.locals.logger.log('debug', 'completed for client ' + result.clientid, { result: result });
                        var contacts = result.response;
                        clientList[result.clientid].contacts = new Array();
                        Object.keys(contacts).forEach(function(contactID)
                        {
                          var contact = contacts[contactID];
                          var filteredContact = _.pick(contact, 'real_name', 'email_name', 'email_domain', 'login', 'phone', 'email');
                          clientList[result.clientid].contacts.push(filteredContact);
                        });
                      }
                  }
                }
                Object.keys(clientList).forEach(function(clientid) {
                  client = clientList[clientid];
                  if (client.company != 'REMOVED' && client.active == 1) {
                    filteredClient = _.pick(client, 'clientid', 'full_name', 'company', 'email', 'phone', 'salesperson', 'contacts');
                    if (filteredClient.full_name == '')
                    {
                      filteredClient.full_name = client.first + ' ' + client.last;
                    }
                    aReturn.push(filteredClient);
                    foundSome = true;
                  }
                });
              }
              if (foundSome) {
                res.type('application/json');
                res.send(JSON.stringify({ aaData: aReturn }));
              } else {
                res.send(404);
              }
            });
        }
      });
    });
  function parseRedisSet(reply)
  {
    var items = new Array();
    for (i=0; i<=reply.length;i++)
    {
      if (reply[i] != 'undefined')
      {
        try {
          var item = reply[i];
          items.push(JSON.parse(item));
        } catch (e) {
          app.locals.logger.log('debug', 'Tried to parse invalid JSON: "' + e.message + '"', { json: reply[i]});
        }
      }
    }
    return items;
  }
}
