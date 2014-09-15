/* jshint unused: false, sub: true */
module.exports = function (app, config, authenticator) {
  "use strict";
  var utils = require('../../../lib/utils');

  app.get('/api/v1/puppet/devices/hostname/:hostname', authenticator.roleHandler.can('use api'), function (req, res) {
    app.locals.puppetModule.getDevice(req.params.hostname, function (err, device) {
      if (err) {
        res.send(500);
      } else {
        var resBody = JSON.stringify({ aaData: device });
        res.type('application/json');
        res.send(resBody);
      }
    });
  });

  app.get('/api/v1/puppet/metrics/population', authenticator.roleHandler.can('use api'), function (req, res) {

    var request = require('request');
    var async = require('async');

    var getNumNodes = function (callback) {
      var URL = app.get('puppetdb_uri') + '/metrics/mbean/com.puppetlabs.puppetdb.query.population%3Atype%3Ddefault%2Cname%3Dnum-nodes';
      request({ url: URL, json: true }, function (error, response, body) {
        if (error || !body.Value) {
          callback(error, 0);
        } else {
          callback(error, body.Value);
        }
      });
    };

    var getNumResources = function (callback) {
      var URL = app.get('puppetdb_uri') + '/metrics/mbean/com.puppetlabs.puppetdb.query.population%3Atype%3Ddefault%2Cname%3Dnum-resources';
      request({ url: URL, json: true }, function (error, response, body) {
        if (error || !body.Value) {
          callback(error, 0);
        } else {
          callback(error, body.Value);
        }
      });
    };

    var getResourceDupes = function (callback) {
      var URL = app.get('puppetdb_uri') + '/metrics/mbean/com.puppetlabs.puppetdb.query.population%3Atype%3Ddefault%2Cname%3Dpct-resource-dupes';
      request({ url: URL, json: true }, function (error, response, body) {
        if (error || !body.Value) {
          callback(error, 0);
        } else {
          callback(error, body.Value);
        }
      });
    };

    var getResourcesPerNode = function (callback) {
      var URL = app.get('puppetdb_uri') + '/metrics/mbean/com.puppetlabs.puppetdb.query.population%3Atype%3Ddefault%2Cname%3Davg-resources-per-node';
      request({ url: URL, json: true }, function (error, response, body) {
        if (error || !body.Value) {
          callback(error, 0);
        } else {
          callback(error, body.Value);
        }
      });
    };

    var handleResults = function (error, results) {
      if (error) {
        res.send(500);
      } else {
        var response = {
          numNodes: results[0],
          numResources: results[1],
          resourceDupes: results[2],
          resourcesPerNode: results[3]
        };
        res.type('application/json');
        res.send(response);
      }
    };

    async.parallel([
      getNumNodes,
      getNumResources,
      getResourceDupes,
      getResourcesPerNode
    ], handleResults);
  });

  app.get('/api/v1/puppet/aggregate_event_counts/hours/:hours', authenticator.roleHandler.can('use api'), function (req, res) {
    var moment = require('moment');
    var hoursAgo = req.params.hours;
    var request = require('request');
    var queryString = '?query=[">", "timestamp", "' + moment().subtract('hours', hoursAgo).format() + '"]';
    queryString += '&summarize-by=certname';

    var URL = app.get('puppetdb_uri') + '/aggregate-event-counts' + queryString;

    request({ url: URL, json: true }, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        app.locals.logger.log('debug', 'fetched data from PuppetDB', { uri: URL});
        res.type('application/json');
        res.send(body);
      } else {
        app.locals.logger.log('error', 'Error processing request', { error: error, uri: URL});
        res.send(500);
      }
    });
  });

  app.get('/api/v1/puppet/aggregate_event_counts/hours/:hours', authenticator.roleHandler.can('use api'), function (req, res) {
    var moment = require('moment');
    var hoursAgo = req.params.hours;
    var request = require('request');
    var queryString = '?query=' +
      '["and", ' +
      '["~", "certname", ".*"],' +
      '[">", "timestamp", "' + moment().subtract('hours', hoursAgo).format() + '"]' +
      ']';

    queryString += '&summarize-by=certname';

    var URL = app.get('puppetdb_uri') + '/aggregate-event-counts' + queryString;

    request({ url: URL, json: true }, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        app.locals.logger.log('debug', 'fetched data from PuppetDB', { uri: URL});
        res.type('application/json');
        res.send(body);
      } else {
        app.locals.logger.log('error', 'Error processing request', { error: error, uri: URL});
        res.send(500);
      }
    });
  });

  app.get('/api/v1/puppet/failures/hours/:hours', authenticator.roleHandler.can('use api'), function (req, res) {
    var moment = require('moment');
    var hoursAgo = req.params.hours;
    var request = require('request');
    var queryString = '?query=["and", ["=", "status", "failure"],' +
      '["~", "certname", "' + app.locals.config.mgmtDomain + '$"],' +
      '[">", "timestamp", "' + moment().subtract('hours', hoursAgo).format() + '"]]';

    var URL = app.get('puppetdb_uri') + '/events' + queryString;

    request({ url: URL, json: true }, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        app.locals.logger.log('debug', 'fetched data from PuppetDB', { uri: URL});
        res.type('application/json');
        res.send({ aaData: body});
      } else {
        app.locals.logger.log('error', 'Error processing request', { error: error, uri: URL});
        res.send(500);
      }
    });
  });

  app.get('/api/v1/puppet/devices/hostname/:hostname/facts', authenticator.roleHandler.can('use api'), function (req, res) {
    var hostname = req.params.hostname;
    app.locals.puppetModule.getDevice(hostname, function (err, device) {
      if (err) {
        res.send(500);
      } else {
        var resBody = JSON.stringify({ aaData: device.factsArray });
        res.type('application/json');
        res.send(resBody);
      }
    });
  });

  app.get('/api/v1/puppet/catalog/hostname/:hostname', authenticator.roleHandler.can('use api'), function (req, res) {
    var request = require('request');
    var hostname = req.params.hostname;
    var url = app.get('puppetdb_uri') + '/catalogs/' + hostname;
    app.locals.logger.log('debug', 'Requesting data from Puppet', {url: url});
    request({ url: url, json: true }, function (err, response, body) {
      if (err) {
        res.send(500);
      } else {
        res.type('application/json');
        res.send(body);
      }
    });
  });
// GET /v3/nodes/<NODE>/resources/<TYPE>/<TITLE>
  var isSensuCheck = function (resource, hostname) {
    var _ = require('underscore');
    if (!(_.contains(resource.tags, 'sensu::check'))) {
      return false;
    } else if (resource.type !== 'Sensu::Check') {
      return false;
    } else if (resource.title === 'ping_' + hostname) {
      return false;
    } else {
      return true;
    }
  };

  app.get('/api/v1/sensu/checks/hostname/:hostname', authenticator.roleHandler.can('use api'), function (req, res) {
    var _ = require('underscore');
    var request = require('request');
    var hostname = req.params.hostname;
    var url = app.get('puppetdb_uri') + '/catalogs/' + hostname;
    app.locals.logger.log('debug', 'Requesting data from Puppet', {url: url});
    request({ url: url, json: true }, function (err, response, body) {
      if (err) {
        res.send(500);
      } else {
        if (body.data) {
          var catalog = body.data;
          var resourceList = catalog.resources;
          var checks = [];
          _.each(resourceList, function (resource) {
            if (isSensuCheck(resource, hostname)) {
              var check = {
                title: resource.title,
                occurrences: resource.parameters.occurrences,
                standalone: resource.parameters.standalone,
                subscribers: resource.parameters.subscribers,
                handlers: resource.parameters.handlers,
                interval: resource.parameters.interval,
                command: resource.parameters.command,
                parameters: resource.parameters
              };
              checks.push(_.defaults(check, {command: '', handlers: [], occurrences: 0, interval: 0}));
            }
          });
          res.type('application/json');
          res.send(JSON.stringify({ aaData: checks }));
        } else {
          if (body.error && body.error === 'Could not find catalog for ' + hostname) {
            res.send(404);
          } else {
            res.send(500);
          }
        }
      }
    });
  });

  app.get('/api/v1/sensu/events', authenticator.roleHandler.can('use api'), function (req, res) {
    app.locals.monModule.getEvents(function (err, events) {
      if (err) {
        res.send(500);
      } else {
        res.type('application/json');
        res.send(JSON.stringify({ aaData: events}));
      }
    });
  });

  app.get('/api/v1/sensu/events/hostname/:hostname', authenticator.roleHandler.can('use api'), function (req, res) {
    var hostname = req.params.hostname;
    app.locals.monModule.getDeviceEvents(hostname, function (err, events) {
      if (err) {
        app.locals.logger.log('error', 'Error handling request', {message: err.message});
        res.send(500);
      } else {
        res.type('application/json');
        res.send(JSON.stringify({ aaData: events }));
      }
    });
  });

  app.get('/api/v1/sensu/events/filtered', authenticator.roleHandler.can('use api'), function (req, res) {
    var async = require('async');

    var getEvents = function (callback) {
      app.locals.monModule.getEvents(function (err, events) {
        if (!err) {
          callback(err, events);
        } else {
          callback(err, null);
        }
      });
    };

    var getStashes = function (callback) {
      app.locals.monModule.getStashes('silence', function (err, stashes) {
        if (!err) {
          callback(err, stashes);
        } else {
          callback(err, null);
        }
      });
    };

    var stashedContents = {};
    var stashedHashes = {};

    var handleStash = function (stash, done) {
      var content = stash.content;
      var path = stash.path;
      var splitPath = path.split('/');

      var host = splitPath[1] || '';
      var check = splitPath[2] || null;
      var stashContentKey = splitPath.slice(1, 3).join('/');

      if (content.ticketID) {
        content.ticketURL = 'https://' + app.locals.config.crmModule.ticketingHost + app.locals.config.crmModule.ticketingPath + content.ticketID;
      }

      stashedContents[stashContentKey] = content;

      if (!(host in stashedHashes)) {
        stashedHashes[host] = [];
      }
      if (check) {
        stashedHashes[host].push(check);
      } else {
        stashedHashes[host] = [0];
      }
      done(null, stash);
    };

    var handleEvent = function (event, done) {
      var client = event.client;
      var check = event.check;
      var stashContentKey = '';

      if (stashedHashes[client]) {
        var clientStashes = stashedHashes[client];
        if (clientStashes.indexOf(0) > -1) {
          // See if this client is silenced
          stashContentKey = client;
          event.silenced = 1;
          event.silence_contents = stashedContents[stashContentKey];
          event.silence_stash = stashContentKey;
        } else if (clientStashes.indexOf(check) > -1) {
          // See if this client and check is silenced
          stashContentKey = client + '/' + check;
          event.silenced = 1;
          event.silence_contents = stashedContents[stashContentKey];
          event.silence_stash = stashContentKey;
        } else {
          // don't silence anything, host isn't silenced and check doesn't match
          event.silenced = 0;
          event.silence_stash = '';
          event.silence_contents = '';
        }
      } else {
        // this host has no stashes at all
        event.silenced = 0;
        event.silence_stash = '';
        event.silence_contents = '';
      }
      done(null, event);
    };

    var handleResults = function (err, results) {
      var stashes = results.silenced;
      var events = results.events;

      async.map(stashes, handleStash, function (err, stashes) {
        if (err) {
          res.send(500);
        } else {
          app.locals.logger.log('silly', 'stashes', {stashes: stashes});
          async.map(events, handleEvent, function (err, filteredEvents) {
            res.type('application/json');
            res.send(JSON.stringify({ aaData: filteredEvents }));
          });
        }
      });
    };

    var seriesObj = {
      events: getEvents,
      silenced: getStashes
    };

    async.parallel(seriesObj, handleResults);
  });

  app.get('/api/v1/sensu/events/device/:device', authenticator.roleHandler.can('use api'), function (req, res) {
    var uri = '';
    app.locals.monModule.getDeviceEvents(req.params.device, function (error, body) {
      if (!error) {
        app.locals.logger.log('debug', 'fetched data from Sensu');
        res.type('application/json');
        res.send(JSON.stringify(body));
      } else {
        app.locals.logger.log('error', 'Error processing request');
        res.send(500);
      }
    });
  });

  // GET STASHES THAT MATCH ^stash
  app.get('/api/v1/sensu/stashes/:stash', authenticator.roleHandler.can('use api'), function (req, res) {
    app.locals.monModule.getStashes(req.params.stash, function (err, response) {
      if (err) {
        res.send(500);
      } else {
        res.type('application/json');
        res.send(response);
      }
    });
  });

  app.get('/api/v1/sensu/stashes', authenticator.roleHandler.can('use api'), function (req, res) {
    var _ = require('underscore');
    app.locals.monModule.getStashes('.*', function (err, response) {
      if (err) {
        res.send(500);
      } else {
        var retStashes = [];
        var stashList = response;
        _.each(stashList, function (stash) {
          retStashes.push({path: stash.path, content: JSON.stringify(stash.content), expire: stash.expire});
        });
        res.type('application/json');
        res.send({aaData: retStashes});
      }
    });
  });

  // SILENCE a CLIENT
  app.post('/api/v1/sensu/silence/client/:client', authenticator.roleHandler.can('silence monitoring events'), function (req, res) {
    app.locals.monModule.silenceClient(req.currentUser.username, req.params.client, parseInt(req.body.expires), req.body.ticketID, function (err, response) {
      if (err) {
        res.send(500);
      } else {
        app.locals.logger.log('debug', 'response', {response: response});
        res.send(202);
      }
    });
  });

  // SILENCE a CHECK
  app.post('/api/v1/sensu/silence/client/:client/check/:check', authenticator.roleHandler.can('silence monitoring events'), function (req, res) {
    app.locals.monModule.silenceCheck(req.currentUser.username, req.params.client, req.params.check, parseInt(req.body.expires), req.body.ticketID, function (err, response) {
      if (err) {
        res.send(500);
      } else {
        app.locals.logger.log('debug', 'response', {response: response});
        res.send(202);
      }
    });
  });

  // DELETE a CLIENT
  app.delete('/api/v1/sensu/delete/client/:client', authenticator.roleHandler.can('delete monitoring events'), function (req, res) {
    app.locals.monModule.deleteClient(req.params.client, function (err, response) {
      if (err) {
        res.send(500);
      } else {
        app.locals.logger.log('debug', 'response', {response: response});
        res.send(202);
      }
    });
  });

  // DELETE an EVENT
  app.delete('/api/v1/sensu/delete/client/:client/event/:event', authenticator.roleHandler.can('delete monitoring events'), function (req, res) {
    app.locals.monModule.deleteEvent(req.params.client, req.params.event, function (err, response) {
      if (err) {
        res.send(500);
      } else {
        app.locals.logger.log('debug', 'response', {response: response});
        res.send(202);
      }
    });
  });

  // GET SILENCED CLIENTS
  app.get('/api/v1/sensu/silence/client/:client', authenticator.roleHandler.can('use api'), function (req, res) {
    app.locals.monModule.getSilencedClient(req.params.client, function (error, response) {
      if (error) {
        res.send(500);
      } else {
        res.type('application/json');
        res.send(JSON.stringify({aaData: response.body}));
      }
    });
  });

  // UNSILENCE A CLIENT
  app.delete('/api/v1/sensu/silence/client/:client', authenticator.roleHandler.can('silence monitoring events'), function (req, res) {
    app.locals.monModule.unSilenceClient(req.params.client, function (error, response) {
      if (error) {
        res.send(500);
      } else {
        app.locals.logger.log('debug', 'response', {response: response});
        res.send(204);
      }
    });
  });

  // UNSILENCE A CHECK
  app.delete('/api/v1/sensu/silence/client/:client/check/:check', authenticator.roleHandler.can('silence monitoring events'), function (req, res) {
    app.locals.monModule.unSilenceEvent(req.params.client, req.params.check, function (error, response) {
      if (error) {
        res.send(500);
      } else {
        app.locals.logger.log('debug', 'response', {response: response});
        res.send(204);
      }
    });
  });

  // GET SILENCED CHECKS
  app.get('/api/v1/sensu/silence/client/:client/check/:check', authenticator.roleHandler.can('use api'), function (req, res) {
    var request = require('request');
    var path = 'silence/' + req.params.client + '/' + req.params.check;
    request({ url: app.get('sensu_uri') + '/stashes/' + path, json: true }, function (error, response) {
      if (error) {
        res.send(500);
      } else {
        res.type('application/json');
        res.send(JSON.stringify({aaData: response.body}));
      }
    });
  });

  // GET A STASH
  app.get('/api/v1/sensu/silence/:path', authenticator.roleHandler.can('use api'), function (req, res) {
    var request = require('request');
    request({ url: app.get('sensu_uri') + '/stashes/' + req.params.path, json: true }, function (error, response) {
      if (error) {
        res.send(500);
      } else {
        res.type('application/json');
        res.send(JSON.stringify({aaData: response.body}));
      }
    });
  });

  // DELETE A STASH
  app.del('/api/v1/sensu/silence/:path', authenticator.roleHandler.can('silence monitoring events'), function (req, res) {
    var request = require('request');
    request({ method: "DELETE", url: app.get('sensu_uri') + '/stashes/' + req.params.path, json: true }, function (error, response) {
      if (error) {
        res.send(500);
      } else {
        res.type('application/json');
        res.send(JSON.stringify({aaData: response.body}));
      }
    });
  });


  // GET ALL STASHES
  app.get('/api/v1/sensu/silence', authenticator.roleHandler.can('use api'), function (req, res) {
    var request = require('request');
    request({ url: app.get('sensu_uri') + '/stashes', json: true }, function (error, response) {
      if (error) {
        res.send(500);
      } else {
        res.type('application/json');
        res.send(JSON.stringify({aaData: response.body}));
      }
    });
  });

  // GET ALL DEVICES
  app.get('/api/v1/sensu/devices', authenticator.roleHandler.can('use api'), function (req, res) {
    app.locals.crmModule.getDeviceHostnames(function (err, deviceHostnames) {
      if (deviceHostnames === null) {
        res.send(500);
      } else {
        var _ = require('underscore');
        var request = require('request');
        app.locals.monModule.getEvents(function (error, sensuEventList) {
          if (error) {
            res.send(500);
          } else {
            app.locals.logger.log('debug', 'response', {response: sensuEventList});
            app.locals.monModule.getDevices(function (error, sensuDeviceList) {
              if (error) {
                res.send(500);
              } else {
                var deviceList = [];
                _.each(sensuDeviceList, function (device) {
                  _.defaults(device, deviceHostnames[device.name]);
                  _.defaults(device, {name: '', address: '', email: '', company: '', full_name: '', location: ''});
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

  app.get('/api/v1/sensu/devices/hostname/:hostname', authenticator.roleHandler.can('use api'), function (req, res) {
    app.locals.monModule.getDevice(req.params.hostname, function (err, device) {
      if (err) {
        res.send(500);
      } else {
        res.type('application/json');
        res.send(JSON.stringify({ aaData: [device] }));
      }
    });
  });

  app.get('/api/v1/sensu/devices/hostname/:hostname/events', authenticator.roleHandler.can('use api'), function (req, res) {
    app.locals.monModule.getDevice(req.params.hostname, function (err, device) {
      if (err) {
        res.send(500);
      } else {
        res.type('application/json');
        res.send(JSON.stringify({ aaData: [device.events] }));
      }
    });
  });

  app.get('/api/v1/helpdesk/devices/devgroupid/:devgroupid', authenticator.roleHandler.can('use api'), function (req, res) {
    app.locals.crmModule.getDevicesbyTypeGroupID(req.params.devgroupid, function (err, deviceList) {
      if (deviceList === null) {
        res.send(500);
      } else {
        var devices = [];
        Object.keys(deviceList).forEach(function (deviceID) {
          var device = deviceList[deviceID];
          devices.push(device);
        });
        res.type('application/json');
        res.send(JSON.stringify({ aaData: devices}));
      }
    });
  });

  app.get('/api/v1/helpdesk/devices/devgroups', authenticator.roleHandler.can('use api'), function (req, res) {
    app.locals.crmModule.getDeviceTypeList(function (err, deviceGroupList) {
      if (deviceGroupList === null) {
        res.send(500);
      } else {
        var _ = require('underscore');
        var deviceGroups = _.values(deviceGroupList);
        var returnList = [];

        _.each(deviceGroups, function (group) {
          returnList.push(_.pick(group, ['devtype_group_id', 'name', 'priority']));
        });

        res.type('application/json');
        res.send(JSON.stringify(returnList));
      }
    });
  });

  app.get('/api/v1/helpdesk/devices/hostname', authenticator.roleHandler.can('use api'), function (req, res) {
    app.locals.crmModule.getDeviceHostnames(function (err, deviceHostnames) {
      if (deviceHostnames === null) {
        res.send(500);
      } else {
        var _ = require('underscore');
        var devices = _.values(deviceHostnames);
        res.type('application/json');
        res.send(JSON.stringify({ aaData: devices}));
      }
    });
  });

  app.get('/api/v1/helpdesk/devices/deviceid/:deviceid/tickets', authenticator.roleHandler.can('use api'), function (req, res) {
    app.locals.crmModule.getTicketsbyDeviceID(req.params.deviceid, function (err, ticketList) {
      if (err) {
        res.send(500);
      } else {
        var _ = require('underscore');
        var tickets = _.values(ticketList);
        for (var i = 0; i < tickets.length; i++) {
          tickets[i].timestamp = utils.getFormattedTimestamp(tickets[i].timestamp);
          tickets[i].activity = utils.getFormattedTimestamp(tickets[i].activity);
        }
        res.type('application/json');
        res.send(JSON.stringify({aaData: tickets}));
      }
    });
  });

  app.get('/api/v1/helpdesk/devices/rack/:rack', authenticator.roleHandler.can('use api'), function (req, res) {
    app.locals.crmModule.getDevicesByRack(req.params.rack, function (error, device) {
      if (error !== null) {
        res.send(500);
      } else {
        if (device.dev && device.dev !== null) {
          res.type('application/json');
          res.send(JSON.stringify({ aaData: [device] }));
        } else {
          res.send(500);
        }
      }
    });
  });

  app.get('/api/v1/helpdesk/devices/hostname/:hostname', authenticator.roleHandler.can('use api'), function (req, res) {
    app.locals.crmModule.getDeviceByHostname(req.params.hostname, function (error, device) {
      if (error !== null) {
        res.send(500);
      } else {
        if (device.dev && device.dev !== null) {
          res.type('application/json');
          res.send(JSON.stringify({ aaData: [device] }));
        } else {
          res.send(500);
        }
      }
    });
  });

  app.get('/api/v1/helpdesk/devices/deviceid/:deviceid', authenticator.roleHandler.can('use api'), function (req, res) {
    app.locals.crmModule.getDeviceByID(req.params.deviceid, function (error, device) {
      if (error !== null) {
        res.send(500);
      } else {
        if (device.dev && device.dev !== null) {
          res.type('application/json');
          res.send(JSON.stringify({ aaData: [device] }));
        } else {
          res.send(500);
        }
      }
    });
  });

  app.get('/api/v1/helpdesk/contacts/search', authenticator.roleHandler.can('use api'), function (req, res) {
    var results = [];
    var query = req.query.q;
    app.locals.logger.log('debug', 'Search Query', {query: query});
    results.push({"id": "1", "name": "johann8384"});
    results.push({"id": "2", "name": "rmc3"});
    res.type('application/json');
    res.send(results);
  });

  app.get('/api/v1/sales/leads', authenticator.roleHandler.can('use api'), function (req, res) {
    app.locals.crmModule.getLeads(function (err, leadList) {
      if (err) {
        res.send(500);
      } else {
        var _ = require('underscore');
        var leads = _.values(leadList);
        res.type('application/json');
        res.send(JSON.stringify({aaData: leads}));
      }
    });
  });

  app.get('/api/v1/sales/clients', authenticator.roleHandler.can('use api'), function (req, res) {
    app.locals.crmModule.getAllClients(function (err, clients) {
      if (err) {
        res.send(500);
      } else {
        var _ = require('underscore');
        var async = require('async');
        async.map(_.values(clients), function (client, done) {
          done(null, {
            email: _.pick(client, ['clientid', 'email']),
            company: _.pick(client, ['clientid', 'listed_company']),
            name: _.pick(client, ['clientid', 'full_name'])
          });
        }, function (err, clientList) {
          if (err) {
            res.send(500);
          } else {
            var emails = [];
            var companies = [];
            var names = [];
            for (var x = 0; x < clientList.length; x++) {
              var client = clientList[x];
              if (client.email.email !== '') {
                emails.push(client.email.email);
              }
              if (client.company.listed_company !== '') {
                companies.push(client.company.listed_company);
              }
              if (client.name.full_name !== '') {
                names.push(client.name.full_name);
              }
            }
            res.type('application/json');
            res.send({emails: emails, companies: companies, names: names});
          }
        });
      }
    });
  });

  app.get('/api/v1/sales/pipeline', authenticator.roleHandler.can('view pipeline'), function (req, res) {
    app.locals.crmModule.getSalesPipeline(true, function (err, pipeline) {
      if (err) {
        res.send(500);
      } else {
        res.type('application/json');
        res.send(JSON.stringify(pipeline));
      }
    });
  });

  app.get('/api/v1/sales/pipeline/index/:index', authenticator.roleHandler.can('view pipeline'), function (req, res) {
    app.locals.crmModule.getSalesPipeline(true, function (err, pipeline) {
      if (err) {
        res.send(500);
      } else {
        var elasticsearch_index = '';
        for (var x = 0; x < pipeline.pipeline.length; x++) {
          var opportunity = pipeline.pipeline[x];
          elasticsearch_index += '{ "create": { "index": "' + req.params.index + '", "type":"opportunity", "id":"' + opportunity.opportunity_id + '" }}\n';
          elasticsearch_index += JSON.stringify(opportunity) + '\n';
        }
        res.type('text/plain');
        res.send(elasticsearch_index);
      }
    });
  });

  app.get('/api/v1/sales/pipeline/mapping/:type', authenticator.roleHandler.can('view pipeline'), function (req, res) {
    var type = function (type) {
      return { type: type };
    };

    if (req.params.type === 'opportunity') {
      var opportunity = {
        'opportunity': {
          'properties': {
            'opportunity_id': type('integer'),
            'client_id': type('integer'),
            'contact_id': type('integer'),
            'ts': type('long'),
            'activity': type('long'),
            'status': type('integer'),
            'opportunity_type_id': type('integer'),
            'opportunity_stage_id': type('integer'),
            'owner': type('integer'),
            'owner_name': type('string'),
            'closure_ts': { 'type': 'long'},
            'closure_pct': type('float'),
            'price_min': type('float'),
            'price_max': type('float'),
            'value': type('float'),
            'last_action': type('string'),
            'next_step': type('string'),
            'description': type('string'),
            'listed_company': type('string'),
            'stage': type('string'),
            'type': type('string')
          }
        }
      };
      res.type('application/json');
      res.send(JSON.stringify(opportunity));
    } else {
      res.send(404);
    }
  });

  var createOpportunityIndex = function (client, index, callback) {
    client.indices.exists({index: index}, function (err, response, status) {
      if (err) {
        callback(err);
      } else if (response !== false || status !== 404) {
        callback(new Error('index already exists:' + index));
      } else {
        client.indices.create({index: index}, function (err, response, status) {
          if (err) {
            callback(err);
          } else {
            callback(null, response);
          }
        });
      }
    });
  };

  var createClientMapping = function (client, index, callback) {
    var type = function (type, store) {
      if (arguments.length <= 1) {
        store = false;
      }

      return { type: type, store: store };
    };

    var uberClient = { clientid: type('integer'),
      first: type('string'),
      last: type('string'),
      checkname: type('string'),
      company: type('string', true),
      address: type('string', true),
      city: type('string', true),
      state: type('string', true),
      zip: type('string', true),
      phone: type('string', true),
      fax: type('string', true),
      ss: type('string'),
      email: type('string', true),
      comments: type('string'),
      country: type('string', true),
      balance: type('float'),
      credit_balance: type('float'),
      acct_balance: type('float'),
      datesend: type('integer'),
      datepay: type('integer'),
      password: { type: 'string', store: false, index: 'no', ignore_above: 0 },
      active: type('integer', true),
      permnote: type('string'),
      tempnote: type('string'),
      priority: type('integer'),
      class_id: type('integer'),
      login: type('string', true),
      access: type('string'),
      retry_every: type('integer'),
      referred: type('string'),
      referred_by: type('integer'),
      credit_bool: type('integer'),
      discount: type('float'),
      latest_inv: type('long'),
      datedue: type('long'),
      grace_due: type('integer'),
      listed_company: type('string'),
      full_name: type('string'),
      created: type('long'),
      password_timeout: type('integer'),
      password_changed: type('integer'),
      charge_days: type('integer'),
      discount_type: type('integer'),
      qblistid: type('string'),
      qbeditseq: type('string'),
      prefer_lang: type('integer'),
      acctmgr: type('integer'),
      salesperson: type('integer'),
      late_fee_scheme_id: type('integer'),
      invoice_delivery: type('integer'),
      business: type('integer'),
      prebill_method: type('integer'),
      prebill_days: type('integer'),
      default_renew: type('integer'),
      extended_prorate_day: type('integer'),
      prorate_min_days: type('integer'),
      auto_apply_credit: type('integer'),
      inv_balance: type('float'),
      salesperson_name: type('string'),
      salesperson_email: type('string')
    };
    client.indices.putMapping({index: index, type: 'client', body: uberClient, ignoreConflicts: true }, function (err, response, status) {
      if (err) {
        callback(err);
      } else {
        callback(null, response);
      }
    });
  };

  var createEventMapping = function (client, index, callback) {
    var type = function (type, store) {
      if (arguments.length <= 1) {
        store = false;
      }

      return { type: type, store: store };
    };
    var event = {
      eventid: type('integer'),
      action: type('string'),
      clientid: type('integer'),
      user: type('string'),
      time: type('date'),
      amount: type('float'),
      balance: type('float'),
      ledger: type('float'),
      type: type('integer'),
      reference_id: type('integer'),
      event_type: type('integer'),
      client_viewable: type('boolean'),
      reference_type: type('string')
    };

    client.indices.putMapping({index: index, type: 'event', body: event, ignoreConflicts: true }, function (err, response, status) {
      if (err) {
        callback(err);
      } else {
        callback(null, response);
      }
    });
  };

  var createOpportunityMapping = function (client, index, callback) {
    var type = function (type, store) {
      if (arguments.length <= 1) {
        store = false;
      }

      return { type: type, store: store };
    };
    var opportunity = {
      'opportunity': {
        'properties': {
          'opportunity_id': type('integer'),
          'client_id': type('integer'),
          'salesperson_name': type('string'),
          'salesperson_email': type('string'),
          'salesperson_id': type('integer'),
          'contact_id': type('integer'),
          'ts': type('date'),
          'activity': type('date'),
          'status': type('integer'),
          'timestamp': type('date', true),
          'opportunity_type_id': type('integer'),
          'opportunity_stage_id': type('integer'),
          'owner': type('integer'),
          'owner_name': type('string'),
          'closure_ts': { 'type': 'long'},
          'closure_pct': type('float'),
          'price_min': type('float'),
          'price_max': type('float'),
          'value': type('float'),
          'last_action': type('string'),
          'next_step': type('string'),
          'description': type('string'),
          'listed_company': type('string'),
          'stage': type('string'),
          'type': type('string')
        }
      }
    };
    client.indices.putMapping({index: index, type: 'opportunity', body: opportunity, ignoreConflicts: true }, function (err, response, status) {
      if (err) {
        callback(err);
      } else {
        callback(null, response);
      }
    });
  };

  var populateOpportunityIndex = function (client, index, callback) {
    app.locals.crmModule.getClients(function (err, clients) {
      if (err) {
        callback(err);
      } else {
        app.locals.crmModule.getSalesPipeline(true, function (err, pipeline) {
          if (err) {
            callback(err);
          } else {
            var async = require('async');
            async.map(pipeline.pipeline, function (opportunity, mapCallback) {
              var moment = require('moment');
              var clientid = opportunity.client_id;
              opportunity.timestamp = moment.unix(opportunity.activity).format('YYYY-MM-DDTHH:mm:ssZ');
              opportunity.activity = moment.unix(opportunity.activity).format('YYYY-MM-DDTHH:mm:ssZ');
              opportunity.ts = moment.unix(opportunity.ts).format('YYYY-MM-DDTHH:mm:ssZ');
              if (clients.hasOwnProperty(clientid)) {
                var uberClient = clients[clientid];
                opportunity.salesperson_name = uberClient.salesperson_name;
                opportunity.salesperson_email = uberClient.salesperson_email;
                opportunity.salesperson_id = uberClient.salesperson;
              } else {
                // no client
              }
              var opportunityJSON = JSON.stringify(opportunity);
              client.create({ index: index, type: 'opportunity', timestamp: opportunity.timestamp, id: opportunity.opportunity_id, body: opportunityJSON }, function (err, response, status) {
                mapCallback(err, response);
              });
            }, callback);
          }
        });
      }
    });
  };

  var populateClientIndex = function (client, index, callback) {
    app.locals.crmModule.getClients(function (err, clients) {
      if (err) {
        callback(err);
      } else {
        var async = require('async');
        var _ = require('underscore');
        async.map(_.values(clients), function (uberClient, mapCallback) {
          var moment = require('moment');
          uberClient.created = moment.unix(uberClient.created).format('YYYY-MM-DDTHH:mm:ssZ');
          var uberClientJSON = JSON.stringify(uberClient);
          client.create({ index: index, type: 'client', timestamp: uberClient.created, id: uberClient.clientid, body: uberClientJSON }, function (err, response, status) {
            mapCallback(err, response);
          });
        }, callback);
      }
    });
  };

  app.get('/api/v1/sales/pipeline/populateES', authenticator.roleHandler.can('view pipeline'), function (req, res) {
    var elasticsearch = require('elasticsearch');
    var client = new elasticsearch.Client({
      host: 'localhost:9200',
      log: 'error'
    });
    var moment = require('moment');
    var hour = moment().format('YYYY.MM.DD.HH');
    var index = 'pipeline-' + hour;

    createOpportunityIndex(client, index, function (err, response) {
      if (err) {
        res.send(500);
      } else {
        createOpportunityMapping(client, index, function (err, response) {
          if (err) {
            res.send(500);
          } else {
            createClientMapping(client, index, function (err, response) {
              if (err) {
                res.send(500);
              } else {
                createEventMapping(client, index, function (err, response) {
                  if (err) {
                    res.send(500);
                  } else {
                    populateClientIndex(client, index, function (err, response) {
                      if (err) {
                        res.send(500);
                      } else {
                        populateOpportunityIndex(client, index, function (err, response) {
                          if (err) {
                            res.send(500);
                          } else {
                            res.type('application/json');
                            res.send(response);
                          }
                        });
                      }
                    });
                  }
                });
              }
            });
          }
        });
      }
    });
  });

  var createSelectBoxHTML = function (field, multiple) {
    if (arguments.length <= 1) {
      multiple = '';
    }

    var html = '';
    var name = field.variable;
    var label = field.label;
    var options = field.options.split(",");

    html += '<label for="' + name + '">' + label + '</label>';
    html += '<select class="form-control" ' + multiple + ' id="' + name + '" name="' + name + '">';
    for (var y = 0; y < options.length; y++) {
      var option = options[y].replace('"', '').replace('"', '');
      html += '<option ';
      if (option === field.default_val) {
        html += ' selected ';
      }
      html += ' value="' + option + '"> ' + option + '</option>';
    }
    html += '</select>';
    return html;
  };

  var createTextHTML = function (field) {
    var html = '';
    var name = field.variable;
    var label = field.label;
    var value = field.default_val.replace('"', '').replace('"', '');
    html += '<label for="' + name + '">' + label + '</label>';
    html += '<input class="form-control" type="text" value="' + value + '" id="' + name + '" name="' + name + '">';
    return html;
  };

  app.get('/api/v1/crm/metadata/fieldhtml/leads', authenticator.roleHandler.can('use api'), function (req, res) {
    app.locals.crmModule.getMetadataFields('client', function (err, metadata) {
      if (err) {
        res.send(500);
      } else {
        var _ = require('underscore');
        var fields = _.values(metadata);
        var retHTML = '';

        for (var x = 0; x < fields.length; x++) {
          if (fields[x].metagroup_name === 'Lead') {
            var field = fields[x];
            switch (field.type) {
              case 'select':
                retHTML += createSelectBoxHTML(field);
                break;
              case 'text':
                retHTML += createTextHTML(field);
                break;
              case 'select_multiple':
                retHTML += createSelectBoxHTML(field, 'multiple');
                break;
              default:
            }
          }
        }

        res.type('text/html');
        res.send(retHTML);
      }
    });
  });

  app.get('/api/v1/crm/metadata/fields/lead', authenticator.roleHandler.can('use api'), function (req, res) {
    app.locals.crmModule.getMetadataFields('client', function (err, metadata) {
      if (err) {
        res.send(500);
      } else {
        var _ = require('underscore');
        var fields = _.values(metadata);
        var retFields = [];
        for (var x = 0; x < fields.length; x++) {
          if (fields[x].metagroup_name === 'Lead') {
            retFields.push(fields[x]);
          }
        }

        res.type('application/json');
        res.send(JSON.stringify(retFields));
      }
    });
  });

  app.get('/api/v1/crm/metadata/group/:group', authenticator.roleHandler.can('use api'), function (req, res) {
    app.locals.crmModule.getMetadataGroup(req.params.group, function (err, metadata) {
      if (err) {
        res.send(500);
      } else {
        res.type('application/json');
        res.send(JSON.stringify(metadata));
      }
    });
  });

  app.get('/api/v1/crm/metadata/fields/:group', authenticator.roleHandler.can('use api'), function (req, res) {
    app.locals.crmModule.getMetadataFields(req.params.group, function (err, metadata) {
      if (err) {
        res.send(500);
      } else {
        res.type('application/json');
        res.send(JSON.stringify(metadata));
      }
    });
  });

  app.get('/api/v1/helpdesk/events', authenticator.roleHandler.can('use api'), function (req, res) {
    app.locals.crmModule.getEventList(function (err, eventList) {
      if (err) {
        res.send(500);
      } else {
        var _ = require('underscore');
        var events = _.values(eventList);
        res.type('application/json');
        res.send(JSON.stringify({aaData: events}));
      }
    });
  });

  app.get('/api/v1/sales/pipeline', authenticator.roleHandler.can('view pipeline'), function (req, res) {
    app.locals.crmModule.getSalesPipeline(true, function (err, pipeline) {
      if (err) {
        res.send(500);
      } else {
        res.type('application/json');
        res.send(JSON.stringify(pipeline));
      }
    });
  });

  app.get('/api/v1/sales/pipeline/index/:index', authenticator.roleHandler.can('view pipeline'), function (req, res) {
    app.locals.crmModule.getSalesPipeline(true, function (err, pipeline) {
      if (err) {
        res.send(500);
      } else {
        var elasticsearch_index = '';
        for (var x = 0; x < pipeline.pipeline.length; x++) {
          var opportunity = pipeline.pipeline[x];
          elasticsearch_index += '{ "create": { "index": "' + req.params.index + '", "type":"opportunity", "id":"' + opportunity.opportunity_id + '" }}\n';
          elasticsearch_index += JSON.stringify(opportunity) + '\n';
        }
        res.type('text/plain');
        res.send(elasticsearch_index);
      }
    });
  });

  app.get('/api/v1/sales/pipeline/mapping/:type', authenticator.roleHandler.can('view pipeline'), function (req, res) {
    var type = function (type) {
      return { type: type };
    };

    if (req.params.type === 'opportunity') {
      var opportunity = {
        'opportunity': {
          'properties': {
            'opportunity_id': type('integer'),
            'client_id': type('integer'),
            'contact_id': type('integer'),
            'ts': type('long'),
            'activity': type('long'),
            'status': type('integer'),
            'opportunity_type_id': type('integer'),
            'opportunity_stage_id': type('integer'),
            'owner': type('integer'),
            'owner_name': type('string'),
            'closure_ts': { 'type': 'long'},
            'closure_pct': type('float'),
            'price_min': type('float'),
            'price_max': type('float'),
            'value': type('float'),
            'last_action': type('string'),
            'next_step': type('string'),
            'description': type('string'),
            'listed_company': type('string'),
            'stage': type('string'),
            'type': type('string')
          }
        }
      };
      res.type('application/json');
      res.send(JSON.stringify(opportunity));
    } else {
      res.send(404);
    }
  });

  app.get('/api/v1/sales/pipeline/opportunity', authenticator.roleHandler.can('view pipeline'), function (req, res) {
    var query = {
      "query": {
        "filtered": {
          "query": {
            "match_all": {}
          },
          "filter": {
            "range": {
              "status": { "from": 1, "to": 1 }
            }
          }
        }
      },
      "aggs": {
        "stages": {
          "terms": {
            "field": "opportunity_stage_id"
          },
          "aggs": {
            "total_value": { "sum": { "field": "value" }},
            "avg_value": { "avg": { "field": "value" }}
          }
        },
        "total_value": { "sum": { "field": "value" }},
        "avg_value": { "avg": { "field": "value" }}
      }
    };

    var elasticsearch = require('elasticsearch');
    var client = new elasticsearch.Client({
      host: 'localhost:9200',
      log: 'trace'
    });
    var searchParams = {
      index: '[pipeline-]YYYY.MM.DD.HH',
      type: 'opportunity',
      body: query
    };

    client.search(searchParams, function (err, response, status) {
      if (err) {
        res.send(500);
      } else if (status !== 200) {
        res.send(status);
      } else {
        res.type('application/json');
        res.send(response.aggregations.stages.buckets);
      }
    });
  });
  /*
   {
   "query": {
   "filtered" : {
   "query" : {
   "match_all" : {}
   },
   "filter" : {
   "range" : {
   "status": { "from" : 1, "to": 1}}
   }
   }
   },
   "aggs" : {
   "stages" : { "terms" : { "field" : "stage" }},
   "total_value" : { "sum": { "field" : "value" }},
   "avg_value" : { "avg": { "field": "value" }}
   }
   }
   */


  app.get('/api/v1/helpdesk/events', authenticator.roleHandler.can('use api'), function (req, res) {
    app.locals.crmModule.getEventList(function (err, eventList) {
      if (err) {
        res.send(500);
      } else {
        var _ = require('underscore');
        var events = _.values(eventList);
        res.type('application/json');
        res.send(JSON.stringify({aaData: events}));
      }
    });
  });

  app.get('/api/v1/helpdesk/clients', authenticator.roleHandler.can('use api'), function (req, res) {
    app.locals.crmModule.getClients(function (err, clientList) {
      if (err) {
        res.send(500);
      } else {
        var _ = require('underscore');
        var clients = _.values(clientList);
        res.type('application/json');
        res.send(JSON.stringify({aaData: clients}));
      }
    });
  });

  app.get('/api/v1/helpdesk/clients/clientid/:clientid', authenticator.roleHandler.can('use api'), function (req, res) {
    var clientID = req.params.clientid;
    app.locals.crmModule.getClientByID(clientID, function (err, client) {
      if (err) {
        res.send(500);
      } else {
        res.type('application/json');
        res.send(JSON.stringify(client));
      }
    });
  });

  app.get('/api/v1/helpdesk/clients/clientid/:clientid/contacts', authenticator.roleHandler.can('use api'), function (req, res) {
    var clientID = req.params.clientid;
    app.locals.crmModule.getContactsbyClientID(clientID, function (err, contactList) {
      if (err) {
        res.send(500);
      } else {
        var _ = require('underscore');
        var contacts = _.values(contactList);
        res.type('application/json');
        res.send(JSON.stringify(contacts));
      }
    });
  });

  app.get('/api/v1/helpdesk/clients/clientid/:clientid/devices', authenticator.roleHandler.can('use api'), function (req, res) {
    app.locals.crmModule.getDevicesbyClientID(req.params.clientid, function (err, devicelist) {
      if (err) {
        res.send(500);
      } else {
        var _ = require('underscore');
        var devices = _.values(devicelist);
        res.type('application/json');
        res.send(JSON.stringify({ aaData: devices}));
      }
    });
  });

  app.get('/api/v1/helpdesk/clients/clientid/:clientid/tickets', authenticator.roleHandler.can('use api'), function (req, res) {
    app.locals.crmModule.getTicketsbyClientID(req.params.clientid, function (err, ticketList) {
      if (err) {
        res.send(500);
      } else {
        var _ = require('underscore');
        var tickets = _.values(ticketList);
        for (var i = 0; i < tickets.length; i++) {
          tickets[i].timestamp = utils.getFormattedTimestamp(tickets[i].timestamp);
          tickets[i].activity = utils.getFormattedTimestamp(tickets[i].activity);
        }
        res.type('application/json');
        res.send(JSON.stringify({aaData: tickets}));
      }
    });
  });

  app.get('/api/v1/helpdesk/api/methods', authenticator.roleHandler.can('use api'), function (req, res) {
    app.locals.crmModule.getAPIMethods(function (err, client) {
      if (err) {
        res.send(500);
      } else {
        res.type('application/json');
        res.send(JSON.stringify(client));
      }
    });
  });

  app.get('/api/v1/helpdesk/tickets', authenticator.roleHandler.can('use api'), function (req, res) {
    app.locals.crmModule.getTickets(function (err, ticketList) {
      if (err) {
        res.send(500);
      } else {
        var _ = require('underscore');
        var tickets = _.values(ticketList);
        for (var i = 0; i < tickets.length; i++) {
          tickets[i].timestamp = utils.getFormattedTimestamp(tickets[i].timestamp);
          tickets[i].activity = utils.getFormattedTimestamp(tickets[i].activity);
        }
        res.type('application/json');
        res.send(JSON.stringify({aaData: tickets}));
      }
    });
  });

  app.get('/api/v1/helpdesk/tickets/ticketid/:ticketid', authenticator.roleHandler.can('use api'), function (req, res) {
    app.locals.crmModule.getTicketbyTicketID(req.params.ticketid, function (err, ticket) {
      if (err) {
        res.send(500);
      } else {
        res.type('application/json');
        res.send(JSON.stringify(ticket));
      }
    });
  });

  app.post('/api/v1/helpdesk/tickets/ticketid/:ticketid/posts', authenticator.roleHandler.can('use api'), function (req, res) {
    var ticketID = req.params.ticketid;
    var subject = req.body.subject;
    var visible = req.body.comment || 0;
    var from = req.currentUser.email;
    var time_spent = req.body.time_spent || 1;
    var documentation = req.body.documentation || '';
    var sensuEventData = req.body.sensuEvent || '';
    var checkString = "Created Ticket from Monitoring Event:\n";

    if (sensuEventData !== '') {
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
      if (err) {
        if (err.code === 'ETIMEDOUT') {
          app.locals.logger.log('warn', 'Got timeout while trying to create support ticket');
          res.send(504);
        } else {
          app.locals.logger.log('error', 'Got err while trying to create support ticket', {err: err});
          res.send(500);
        }
      } else {
        if (Object.prototype.toString.call(response) === '[object String]') {
          response = JSON.parse(response);
        }
        var ticketID = req.params.ticketid;
        var responseObj = {status: response.status, error_code: response.error_code, error_message: response.error_message, data: {id: ticketID, url: 'https://' + app.locals.config.crmModule.ticketingHost + app.locals.config.crmModule.ticketingPath + ticketID}};
        res.type('application/json');
        res.send(JSON.stringify(responseObj));
      }
    });
  });

  app.post('/api/v1/helpdesk/tickets/ticket', authenticator.roleHandler.can('use api'), function (req, res) {
    var clientID = req.body.clientID;

    app.locals.crmModule.getAdminByEmail(req.currentUser.email, function (err, adminList) {
      if (err) {
        app.locals.logger.log('error', 'Got err while trying to get admin by email', {email: req.currentUser.email, err: err});
        res.send(500);
      } else {
        var _ = require('underscore');
        adminList = _.values(adminList);

        _.each(adminList, function (admin) {
          if (admin.email === req.currentUser.email) {
            req.currentUser.adminID = admin.id;
          }
        });

        if (!req.currentUser.adminID) {
          req.currentUser.adminID = 0;
        }

        app.locals.crmModule.getContactsbyClientID(clientID, function (err, contactList) {
          if (err) {
            app.locals.logger.log('error', 'Got err while trying to get contacts by client it', {clientID: clientID, err: err});
            res.send(500);
          } else {
            var toList = [];
            var ccList = [];
            contactList = _.values(contactList);
            _.each(contactList, function (contact) {
              if (contact.access) {
                var access = contact.access;
                if (access['submit_new_ticket'] && access['submit_new_ticket'] === 'edit') {
                  toList.push(contact.email);
                } else if (access['submit_new_ticket']) {
                  ccList.push(contact.email);
                }
              }
            });
            req.body.ccList = ccList;
            req.body.toList = toList;
            createSupportTicket(req, res, function (err, response) {
              if (err) {
                if (err.code === 'ETIMEDOUT') {
                  app.locals.logger.log('warn', 'Got timeout while trying to create support ticket');
                  res.send(504);
                } else {
                  app.locals.logger.log('error', 'Got err while trying to create support ticket', {err: err});
                  res.send(500);
                }
              } else {
                if (Object.prototype.toString.call(response) === '[object String]') {
                  response = JSON.parse(response);
                }
                var ticketID = response['data'];
                var responseObj = {status: response.status, error_code: response.error_code, error_message: response.error_message, data: {id: ticketID, url: 'https://' + app.locals.config.crmModule.ticketingHost + app.locals.config.crmModule.ticketingPath + ticketID}};
                res.type('application/json');
                res.send(JSON.stringify(responseObj));
              }
            });
          }
        });
      }
    });
  });

  var createSupportTicket = function (req, res, callback) {
    var subject = req.body.subject;
    var recipient = req.body.recipient;
    var user_id = req.currentUser.adminID;
    var author = req.currentUser.email;
    var ccList = req.body.ccList;
    var toList = req.body.toList;
    var priority = req.body.priority || 1;
    var clientID = req.body.clientID || 0;
    var contactID = req.body.contactID || 0;
    var deviceID = req.body.deviceID || 0;
    var documentation = req.body.documentation || '';
    var sensuEventData = req.body.sensuEvent || '';
    var checkString = '';

    if (sensuEventData !== '') {
      var eventJSON = decodeURI(sensuEventData);
      var sensuEvent = JSON.parse(eventJSON);
      checkString = "Created Ticket from Monitoring Event:\n";
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

    app.locals.crmModule.createNewTicket(msgBody, subject, recipient, user_id, author, ccList, toList, priority, clientID, contactID, deviceID, callback);
  };

  app.get('/api/v1/helpdesk/tickets/ticketid/:ticketid/posts', authenticator.roleHandler.can('use api'), function (req, res) {
    app.locals.crmModule.getTicketPostsbyTicketID(req.params.ticketid, function (err, postsList) {
      if (err) {
        res.send(500);
      } else {
        var _ = require('underscore');
        var posts = _.values(postsList);
        for (var i = 0; i < posts.length; i++) {
          posts[i].timestamp = utils.getFormattedTimestamp(posts[i].timestamp);
        }
        res.type('application/json');
        res.send(JSON.stringify({ aaData: posts }));
      }
    });
  });

  app.get('/api/v1/global/devices/deviceid/:deviceid', authenticator.roleHandler.can('use api'), function (req, res) {
    app.locals.crmModule.getDeviceByID(req.params.deviceid, function (error, uberDevice) {
      if (error !== null) {
        app.locals.logger.log('error', 'Failed to retrieve device from Ubersmith', { deviceid: req.params.deviceid });
        res.send(404);
      } else {
        var async = require('async');
        var hostname = uberDevice.dev_desc + app.locals.config.mgmtDomain;
        async.parallel([
          function (asyncCallback) {
            app.locals.puppetModule.getDevice(hostname, asyncCallback);
          },
          function (asyncCallback) {
            app.locals.monModule.getDevice(hostname, asyncCallback);
          }
        ], function (err, results) {
          if (err) {
            res.send(500);
          } else {
            if (results && results.length === 2) {
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
    });
  });

  app.get('/api/v1/global/devices/hostname/:hostname', authenticator.roleHandler.can('use api'), function (req, res) {
    var async = require('async');
    var hostname = req.params.hostname;
    async.parallel([
      function (asyncCallback) {
        app.locals.crmModule.getDeviceByHostname(hostname, function (err, device) {
          if (err) {
            asyncCallback(null, { error: 'No information is known about ' + hostname, device: {}});
          } else {
            asyncCallback(null, { device: device });
          }
        });
      },
      function (asyncCallback) {
        app.locals.puppetModule.getDevice(hostname, function (err, device) {
          if (err) {
            asyncCallback(null, {});
          } else {
            asyncCallback(null, device);
          }
        });
      },
      function (asyncCallback) {
        app.locals.monModule.getDevice(hostname, function (err, device) {
          if (err) {
            asyncCallback(null, {});
          } else {
            asyncCallback(null, device);
          }
        });
      }
    ], function (err, results) {
      if (err) {
        res.send(500);
      } else {
        if (results && results.length === 3) {
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
  });
};
