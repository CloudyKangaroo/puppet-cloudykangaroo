/* jshint unused: false, sub: true */
module.exports = function (app, config, authenticator) {
  "use strict";
  var utils = require('../../../lib/utils');

  app.get('/api/v1/puppet/devices/hostname/:hostname', authenticator.roleManager.can('use api'), function (req, res) {
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

  app.get('/api/v1/puppet/metrics/population', authenticator.roleManager.can('use api'), function (req, res) {

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

    var handleResults = function(error, results) {
      if (error)
      {
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

  app.get('/api/v1/puppet/aggregate_event_counts/hours/:hours', authenticator.roleManager.can('use api'), function (req, res) {
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

  app.get('/api/v1/puppet/aggregate_event_counts/hours/:hours', authenticator.roleManager.can('use api'), function (req, res) {
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

  app.get('/api/v1/puppet/failures/hours/:hours', authenticator.roleManager.can('use api'), function (req, res) {
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

  app.get('/api/v1/puppet/devices/hostname/:hostname/facts', authenticator.roleManager.can('use api'), function (req, res) {
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

  app.get('/api/v1/puppet/catalog/hostname/:hostname', authenticator.roleManager.can('use api'), function (req, res) {
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

  var isSensuCheck = function(resource, hostname) {
    var _ = require('underscore');
    if (!(_.contains(resource.tags, 'sensu::check')))
    {
      return false;
    } else if (resource.type !== 'Sensu::Check') {
      return false;
    } else if (resource.title === 'ping_' + hostname)
    {
      return false;
    } else {
      return true;
    }
  };

  app.get('/api/v1/sensu/checks/hostname/:hostname', authenticator.roleManager.can('use api'), function (req, res) {
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
            if (isSensuCheck(resource, hostname))
            {
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

  app.get('/api/v1/sensu/events', authenticator.roleManager.can('use api'), function (req, res) {
    app.locals.monModule.getEvents(function(err, events) {
      if (err) {
        res.send(500);
      } else {
        res.type('application/json');
        res.send(JSON.stringify({ aaData: events}));
      }
    });
  });

  app.get('/api/v1/sensu/events/hostname/:hostname', authenticator.roleManager.can('use api'), function (req, res) {
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

  app.get('/api/v1/sensu/events/filtered', authenticator.roleManager.can('use api'), function (req, res) {
    var async = require('async');

    var getEvents = function(callback) {
      app.locals.monModule.getEvents(function(err, events) {
        if (!err) {
          callback(err, events);
        } else {
          callback(err, null);
        }
      });
    };

    var getStashes = function(callback) {
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

    /*
     { path: 'silence/jsklskwtrs-engage05.unittest.us/disk',
     content:
     { timestamp: 1394450361,
     user: 'marta.wiliams',
     ticketID: '12001' },
     expire: 118739 }
     */
    var handleStash = function(stash, done) {
      var content = stash.content;
      var path = stash.path;
      var splitPath = path.split('/');

      var host = splitPath[1] || '';
      var check = splitPath[2] || null;
      var stashContentKey = splitPath.slice(1,3).join('/');

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

    /*
     silence_contents: {
     timestamp: 1394486532,
     user: "richard.chatterton",
     ticketID: "none",
     ticketUrl: "https://portal.contegix.com/admin/supportmgr/ticket_view.php?ticket=none"
     },
     silenced: 1,
     silence_stash: "axis02.contegix.mgmt"
     */

    var handleEvent = function(event, done) {
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

  app.get('/api/v1/sensu/events/device/:device', authenticator.roleManager.can('use api'), function (req, res) {
    var uri = '';
    app.locals.monModule.getDeviceEvents(req.params.device, function(error, body){
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
  app.get('/api/v1/sensu/stashes/:stash', authenticator.roleManager.can('use api'), function (req, res) {
    app.locals.monModule.getStashes(req.params.stash, function (err, response) {
      if (err) {
        res.send(500);
      } else {
        res.type('application/json');
        res.send(response);
      }
    });
  });

  app.get('/api/v1/sensu/stashes', authenticator.roleManager.can('use api'), function (req, res) {
    var _ = require('underscore');
    app.locals.monModule.getStashes('.*', function (err, response) {
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
    });
  });

  // SILENCE a CLIENT
  app.post('/api/v1/sensu/silence/client/:client', authenticator.roleManager.can('silence monitoring events'), function (req, res) {
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
  app.post('/api/v1/sensu/silence/client/:client/check/:check', authenticator.roleManager.can('silence monitoring events'), function (req, res) {
    app.locals.monModule.silenceCheck(req.currentUser.username, req.params.client, req.params.check, parseInt(req.body.expires), req.body.ticketID, function (err, response) {
      if (err) {
        res.send(500);
      } else {
        app.locals.logger.log('debug', 'response', {response: response});
        res.send(202);
      }
    });
  });

  // GET SILENCED CLIENTS
  app.get('/api/v1/sensu/silence/client/:client', authenticator.roleManager.can('use api'), function (req, res) {
    app.locals.monModule.getSilencedClient(req.params.client, function (error, response) {
      if(error){
        res.send(500);
      } else {
        res.type('application/json');
        res.send(JSON.stringify({aaData: response.body}));
      }
    });
  });

  // UNSILENCE A CLIENT
  app.delete('/api/v1/sensu/silence/client/:client', authenticator.roleManager.can('silence monitoring events'), function (req, res) {
    app.locals.monModule.unSilenceClient(req.params.client, function (error, response) {
      if(error){
        res.send(500);
      } else {
        app.locals.logger.log('debug', 'response', {response: response});
        res.send(204);
      }
    });
  });

  // UNSILENCE A CHECK
  app.delete('/api/v1/sensu/silence/client/:client/check/:check', authenticator.roleManager.can('silence monitoring events'), function (req, res) {
    app.locals.monModule.unSilenceCheck(req.params.client, req.params.check, function (error, response) {
      if(error){
        res.send(500);
      } else {
        app.locals.logger.log('debug', 'response', {response: response});
        res.send(204);
      }
    });
  });

  // GET SILENCED CHECKS
  app.get('/api/v1/sensu/silence/client/:client/check/:check', authenticator.roleManager.can('use api'), function (req, res) {
    var request = require('request');
    var path = 'silence/' + req.params.client + '/' + req.params.check;
    request({ url: app.get('sensu_uri') + '/stashes/' + path, json: true }, function (error, response) {
      if(error){
        res.send(500);
      } else {
        res.type('application/json');
        res.send(JSON.stringify({aaData: response.body}));
      }
    });
  });

  // GET A STASH
  app.get('/api/v1/sensu/silence/:path', authenticator.roleManager.can('use api'), function (req, res) {
    var request = require('request');
    request({ url: app.get('sensu_uri') + '/stashes/' + req.params.path, json: true }, function (error, response) {
      if(error){
        res.send(500);
      } else {
        res.type('application/json');
        res.send(JSON.stringify({aaData: response.body}));
      }
    });
  });

  // DELETE A STASH
  app.del('/api/v1/sensu/silence/:path', authenticator.roleManager.can('silence monitoring events'), function (req, res) {
    var request = require('request');
    request({ method: "DELETE", url: app.get('sensu_uri') + '/stashes/' + req.params.path, json: true }, function (error, response) {
      if(error){
        res.send(500);
      } else {
        res.type('application/json');
        res.send(JSON.stringify({aaData: response.body}));
      }
    });
  });


  // GET ALL STASHES
  app.get('/api/v1/sensu/silence', authenticator.roleManager.can('use api'), function (req, res) {
    var request = require('request');
    request({ url: app.get('sensu_uri') + '/stashes', json: true }, function (error, response) {
      if(error){
        res.send(500);
      } else {
        res.type('application/json');
        res.send(JSON.stringify({aaData: response.body}));
      }
    });
  });

  // GET ALL DEVICES
  app.get('/api/v1/sensu/devices', authenticator.roleManager.can('use api'), function (req, res) {
    app.locals.crmModule.getDeviceHostnames(function (err, deviceHostnames){
      if (deviceHostnames === null)
      {
        res.send(500);
      } else {
        var _ = require('underscore');
        var request = require('request');
        app.locals.monModule.getEvents(function(error, sensuEventList) {
          if (error) {
            res.send(500);
          } else {
            app.locals.logger.log('debug', 'response', {response: sensuEventList});
            app.locals.monModule.getDevices(function (error, sensuDeviceList) {
              if(error){
                res.send(500);
              } else {
                var deviceList = [];
                _.each(sensuDeviceList, function (device)
                {
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

  app.get('/api/v1/sensu/devices/hostname/:hostname', authenticator.roleManager.can('use api'), function (req, res) {
    app.locals.monModule.getDevice(req.params.hostname, function (err, device) {
      if (err) {
        res.send(500);
      } else {
        res.type('application/json');
        res.send(JSON.stringify({ aaData: [device] }));
      }
    });
  });

  app.get('/api/v1/sensu/devices/hostname/:hostname/events', authenticator.roleManager.can('use api'), function (req, res) {
    app.locals.monModule.getDevice(req.params.hostname, function (err, device) {
      if (err) {
        res.send(500);
      } else {
        res.type('application/json');
        res.send(JSON.stringify({ aaData: [device.events] }));
      }
    });
  });

  app.get('/api/v1/helpdesk/devices/devgroupid/:devgroupid', authenticator.roleManager.can('use api'), function (req, res) {
    app.locals.crmModule.getDevicesbyTypeGroupID(req.params.devgroupid, function (err, deviceList){
      if (deviceList === null)
      {
        res.send(500);
      } else {
        var devices = [];
        Object.keys(deviceList).forEach(function(deviceID) {
          var device = deviceList[deviceID];
          devices.push(device);
        });
        res.type('application/json');
        res.send(JSON.stringify({ aaData: devices}));
      }
    });
  });

  app.get('/api/v1/helpdesk/devices/devgroups', authenticator.roleManager.can('use api'), function (req, res) {
    app.locals.crmModule.getDeviceTypeList(function (err, deviceGroupList){
      if (deviceGroupList === null)
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

  app.get('/api/v1/helpdesk/devices/hostname', authenticator.roleManager.can('use api'), function (req, res) {
    app.locals.crmModule.getDeviceHostnames(function (err, deviceHostnames){
      if (deviceHostnames === null)
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


  app.get('/api/v1/helpdesk/devices/deviceid/:deviceid/tickets', authenticator.roleManager.can('use api'), function (req, res) {
    app.locals.crmModule.getTicketsbyDeviceID(req.params.deviceid, function (err, ticketList){
      if (err)
      {
        res.send(500);
      }  else {
        var _ = require('underscore');
        var tickets = _.values(ticketList);
        for (var i=0; i<tickets.length; i++)
        {
          tickets[i].timestamp = utils.getFormattedTimestamp(tickets[i].timestamp);
          tickets[i].activity = utils.getFormattedTimestamp(tickets[i].activity);
        }
        res.type('application/json');
        res.send(JSON.stringify({aaData: tickets}));
      }
    });
  });

  app.get('/api/v1/helpdesk/devices/rack/:rack', authenticator.roleManager.can('use api'), function (req, res) {
    app.locals.crmModule.getDevicesByRack(req.params.rack, function (error, device) {
      if (error !== null)
      {
        res.send(500);
      } else {
        if (device.dev && device.dev !== null)
        {
          res.type('application/json');
          res.send(JSON.stringify({ aaData: [device] }));
        } else {
          res.send(500);
        }
      }
    });
  });

  app.get('/api/v1/helpdesk/devices/hostname/:hostname', authenticator.roleManager.can('use api'), function (req, res) {
    app.locals.crmModule.getDeviceByHostname(req.params.hostname, function (error, device) {
      if (error !== null)
      {
        res.send(500);
      } else {
        if (device.dev && device.dev !== null)
        {
          res.type('application/json');
          res.send(JSON.stringify({ aaData: [device] }));
        } else {
          res.send(500);
        }
      }
    });
  });

  app.get('/api/v1/helpdesk/devices/deviceid/:deviceid', authenticator.roleManager.can('use api'), function (req, res) {
    app.locals.crmModule.getDeviceByID(req.params.deviceid, function (error, device) {
      if (error !== null)
      {
        res.send(500);
      } else {
        if (device.dev && device.dev !== null)
        {
          res.type('application/json');
          res.send(JSON.stringify({ aaData: [device] }));
        } else {
          res.send(500);
        }
      }
    });
  });

  app.get('/api/v1/helpdesk/contacts/search', authenticator.roleManager.can('use api'), function (req, res) {
    var results = [];
    var query = req.query.q;
    app.locals.logger.log('debug', 'Search Query', {query: query});
    results.push({"id":"1", "name":"johann8384"});
    results.push({"id":"2", "name":"rmc3"});
    res.type('application/json');
    res.send(results);
  });

  app.get('/api/v1/sales/leads', authenticator.roleManager.can('use api'), function (req, res) {
    app.locals.crmModule.getLeads(function(err, leadList) {
      if (err)
      {
        res.send(500);
      } else {
        var _ = require('underscore');
        var leads = _.values(leadList);
        res.type('application/json');
        res.send(JSON.stringify({aaData: leads}));
      }
    });
  });

  app.get('/api/v1/helpdesk/clients', authenticator.roleManager.can('use api'), function (req, res) {
    app.locals.crmModule.getClients(function(err, clientList) {
      if (err)
      {
        res.send(500);
      } else {
        var _ = require('underscore');
        var clients = _.values(clientList);
        res.type('application/json');
        res.send(JSON.stringify({aaData: clients}));
      }
    });
  });

  app.get('/api/v1/helpdesk/clients/clientid/:clientid', authenticator.roleManager.can('use api'), function (req, res) {
    var clientID = req.params.clientid;
    app.locals.crmModule.getClientByID(clientID, function(err, client) {
      if (err) {
        res.send(500);
      } else {
        res.type('application/json');
        res.send(JSON.stringify(client));
      }
    });
  });

  app.get('/api/v1/helpdesk/clients/clientid/:clientid/contacts', authenticator.roleManager.can('use api'), function (req, res) {
    var clientID = req.params.clientid;
    app.locals.crmModule.getContactsbyClientID(clientID, function(err, contactList) {
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

  app.get('/api/v1/helpdesk/clients/clientid/:clientid/devices', authenticator.roleManager.can('use api'), function (req, res) {
    app.locals.crmModule.getDevicesbyClientID(req.params.clientid, function(err, devicelist) {
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

  app.get('/api/v1/helpdesk/clients/clientid/:clientid/tickets', authenticator.roleManager.can('use api'), function (req, res) {
    app.locals.crmModule.getTicketsbyClientID(req.params.clientid, function(err, ticketList) {
      if (err)
      {
        res.send(500);
      }  else {
        var _ = require('underscore');
        var tickets = _.values(ticketList);
        for (var i=0; i<tickets.length; i++)
        {
          tickets[i].timestamp = utils.getFormattedTimestamp(tickets[i].timestamp);
          tickets[i].activity = utils.getFormattedTimestamp(tickets[i].activity);
        }
        res.type('application/json');
        res.send(JSON.stringify({aaData: tickets}));
      }
    });
  });

  app.get('/api/v1/helpdesk/api/methods', authenticator.roleManager.can('use api'), function (req, res) {
    app.locals.crmModule.getAPIMethods(function(err, client) {
      if (err) {
        res.send(500);
      } else {
        res.type('application/json');
        res.send(JSON.stringify(client));
      }
    });
  });

  app.get('/api/v1/helpdesk/tickets', authenticator.roleManager.can('use api'), function (req, res) {
    app.locals.crmModule.getTickets(function(err, ticketList) {
      if (err)
      {
        res.send(500);
      }  else {
        var _ = require('underscore');
        var tickets = _.values(ticketList);
        for (var i=0; i<tickets.length; i++)
        {
          tickets[i].timestamp = utils.getFormattedTimestamp(tickets[i].timestamp);
          tickets[i].activity = utils.getFormattedTimestamp(tickets[i].activity);
        }
        res.type('application/json');
        res.send(JSON.stringify({aaData: tickets}));
      }
    });
  });

  app.get('/api/v1/helpdesk/tickets/ticketid/:ticketid', authenticator.roleManager.can('use api'), function (req, res) {
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

//  {"status":true,"error_code":null,"error_message":"","data":{"id":"1025875","url":"https://portal.contegix.com/admin/supportmgr/ticket_view.php?ticket=1025875"}}
//  {"data":{"url":"https://portal.contegix.com/admin/supportmgr/ticket_view.php?ticket=undefined"}}

  app.post('/api/v1/helpdesk/tickets/ticketid/:ticketid/posts', authenticator.roleManager.can('use api'), function (req, res) {
    var ticketID = req.params.ticketid;
    var subject = req.body.subject;
    var visible = req.body.comment || 0;
    var from = req.currentUser.email;
    var time_spent = req.body.time_spent || 1;
    var documentation = req.body.documentation || '';
    var sensuEventData = req.body.sensuEvent || '';
    var checkString = "Created Ticket from Monitoring Event:\n";

    if (sensuEventData !== '')
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
        if (err.code === 'ETIMEDOUT')
        {
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

  app.post('/api/v1/helpdesk/tickets/ticket', authenticator.roleManager.can('use api'), function (req, res) {
    var clientID = req.body.clientID;

    app.locals.crmModule.getAdminByEmail(req.currentUser.email, function (err, adminList) {
      if (err) {
        app.locals.logger.log('error', 'Got err while trying to get admin by email', {email: req.currentUser.email, err: err});
        res.send(500);
      } else {
        var _ = require('underscore');
        adminList = _.values(adminList);

        _.each(adminList, function(admin) {
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
            _.each(contactList, function(contact) {
              if (contact.access) {
                var access = contact.access;
                if (access['submit_new_ticket'] && access['submit_new_ticket'] === 'edit')
                {
                  toList.push(contact.email);
                } else if (access['submit_new_ticket']) {
                  ccList.push(contact.email);
                }
              }
            });
            req.body.ccList = ccList;
            req.body.toList = toList;
            createSupportTicket(req, res, function (err, response) {
              if (err)
              {
                if (err.code === 'ETIMEDOUT')
                {
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

  var createSupportTicket = function(req, res, callback) {
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

    if (sensuEventData !== '')
    {
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

  app.get('/api/v1/helpdesk/tickets/ticketid/:ticketid/posts', authenticator.roleManager.can('use api'), function (req, res) {
    app.locals.crmModule.getTicketPostsbyTicketID(req.params.ticketid, function(err, postsList) {
      if (err)
      {
        res.send(500);
      }  else {
        var _ = require('underscore');
        var posts = _.values(postsList);
        for (var i=0; i<posts.length; i++)
        {
          posts[i].timestamp = utils.getFormattedTimestamp(posts[i].timestamp);
        }
        res.type('application/json');
        res.send(JSON.stringify({ aaData: posts }));
      }
    });
  });

  app.get('/api/v1/global/devices/deviceid/:deviceid', authenticator.roleManager.can('use api'), function (req, res) {
    app.locals.crmModule.getDeviceByID(req.params.deviceid, function (error, uberDevice) {
      if (error !== null)
      {
        app.locals.logger.log('error', 'Failed to retrieve device from Ubersmith', { deviceid: req.params.deviceid });
        res.send(404);
      } else {
        var async = require('async');
        var hostname =  uberDevice.dev_desc + app.locals.config.mgmtDomain;
        async.parallel([
          function (asyncCallback) {
            app.locals.puppetModule.getDevice(hostname, asyncCallback);
          },
          function (asyncCallback) {
            app.locals.monModule.getDevice(hostname, asyncCallback);
          }
        ], function(err, results) {
          if (err)
          {
            res.send(500);
          } else {
            if (results && results.length === 2)
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
    });
  });

  app.get('/api/v1/global/devices/hostname/:hostname', authenticator.roleManager.can('use api'), function (req, res) {
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
        app.locals.puppetModule.getDevice(hostname, function (err, device){
          if (err)
          {
            asyncCallback(null, {});
          } else {
            asyncCallback(null, device);
          }
        });
      },
      function (asyncCallback) {
        app.locals.monModule.getDevice(hostname, function (err, device){
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
        if (results && results.length === 3)
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
  });
};
