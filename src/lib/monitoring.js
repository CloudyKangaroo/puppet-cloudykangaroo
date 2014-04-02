module.exports = function (config, logger, crmModule, redisClient) {
  "use strict";

  var utils = require('./utils');

  var getEvents = function (getEventsCallback ) {
    var _ = require('underscore');
    var request = require('request');
    crmModule.getDeviceHostnames(function (err, deviceHostnames){
      if (!deviceHostnames || deviceHostnames === null)
      {
        getEventsCallback(new Error('could not retrieve device hostnames'));
      } else {
        request({ url: config.sensu.uri + '/events', json: true }, function (error, response, body) {
          if (!error && response.statusCode === 200) {
            var events = [];
            _.each(body, function(event) {
              _.defaults(event, deviceHostnames[event.client]);
              event.issued = utils.getFormattedTimestamp(event.issued);
              events.push(event);
            });
            logger.log('debug', 'fetched data from Sensu', { uri: config.sensu.uri + '/events'});
            getEventsCallback( null, events );
          } else {
            logger.log('error', 'Error processing request', { error: error, uri: config.sensu.uri + '/events'});
            getEventsCallback( error, null );
          }
        });
      }
    });
  };

  var getDeviceEvents = function (hostname, getEventsCallback ) {
    var _ = require('underscore');
    var request = require('request');
    crmModule.getDeviceByHostname(hostname, function (error, device) {
      if (error) {

        logger.log('error', 'Could not get device by hostname', {error: error.message});
        getEventsCallback(error, null );

      } else if (!device || device === [] || device === '') {

        logger.log('error', 'No device found for that hostname', {hostname: hostname});
        getEventsCallback({code: 404, message: 'No device found for: ' + hostname}, null);

      } else if (crmModule.getEvents) {

        crmModule.getEvents(2, device.deviceID, getEventsCallback);

      } else {

        var url = config.sensu.uri + '/events/' + device.dev_desc + config.mgmtDomain;
        request({ url: url, json: true }, function (error, response, body) {
          if (!error && response.statusCode === 200) {
            var events = [];
            _.each(body, function(event) {
              _.defaults(event, device);
              event.issued = utils.getFormattedTimestamp(event.issued);
              events.push(event);
            });
            logger.log('debug', 'fetched data from Sensu', { uri: config.sensu.uri + '/events'});
            getEventsCallback( error, events );
          } else {
            logger.log('error', 'Error processing request', { error: error, uri: config.sensu.uri + '/events'});
            getEventsCallback( error, null );
          }
        });
      }
    });
  };

  var getStashes = function (stashes, getStashCallback) {
    var request = require('request');
    request({url: config.sensu.uri + '/stashes', json: true}, function (error, response, body) {
      if (error) {
        getStashCallback(error, body);
      } else {
        var re = new RegExp('^' + stashes);
        var filtered_response = body.filter(function (element) {
          return re.exec(element.path);
        });
        getStashCallback(error, filtered_response);
      }
    });
  };

  var silenceCheck = function (user, client, check, expires, ticketID, silenceCheckCallback) {
    var request = require('request');
    var reqBody = {
      path: "silence/" + client + "/" + check,
      content: { "timestamp": (Math.round(Date.now() / 1000)), "user": user , ticketID: ticketID},
      expire: expires
    };
    logger.log('silly', reqBody);
    request({ method: 'POST', url: config.sensu.uri + '/stashes', json: true, body: JSON.stringify(reqBody) }, function (error, msg, response) {
        logger.log('info', response);
        silenceCheckCallback(error, response);
      }
    );
  };

  var silenceClient = function (user, client, expires, ticketID, silenceClientCallback) {
    var request = require('request');
    var reqBody = {
      path: "silence/" + client,
      content: { "timestamp": (Math.round(Date.now() / 1000)), "user": user , ticketID: ticketID},
      expire: expires
    };
    logger.log('silly', reqBody);
    request({ method: 'POST', url: config.sensu.uri + '/stashes', json: true, body: JSON.stringify(reqBody) }, function (error, msg, response) {
        logger.log('debug', response);
        silenceClientCallback(error, response);
      }
    );
  };

  var getDevice = function(hostname, getDevCallback) {
    var async = require('async');
    redisClient.get('sensu:devices:' + hostname, function (err, deviceJSON) {
      if (!err && deviceJSON)
      {
        logger.log('debug', 'got device from Redis');
        var device = {};
        try {
          device = JSON.parse(deviceJSON);
        }
        catch (e) {
          logger.log('error','uncaught exception');
          getDevCallback(new Error('uncaught exception' + e.message));
        } finally {
          getDevCallback(null, device);
        }
      } else {
        logger.log('debug', 'getting device from sensu');
        async.parallel([
          function (asyncCallback) {
            var request = require('request');
            request({ url: config.sensu.uri+ '/client/' + hostname, json: true }, function (error, response) {
                asyncCallback(error, response.body);
              });
          },
          function (asyncCallback) {
            var request = require('request');
            request({ url: config.sensu.uri + '/events/' + hostname, json: true }, function (error, response) {
                asyncCallback(error, response.body);
              });
          }
        ], function(err, results) {
          if (err)
          {
            getDevCallback(err);
          } else {
            if (results && results.length === 2)
            {
              var sensuDevice = {};
              if (!results[0])
              {
                var node = { address: 'unknown', name: hostname, safe_mode: 0, subscriptions: [], timestamp: 0 };
                var events = [ { output: "No Events Found", status: 1, issued: Date.now(), handlers: [], flapping: false, occurrences: 0, client: hostname, check: 'N/A'}];
                sensuDevice = {error: 'No information is known about ' + hostname, events: events, node: node};
              } else {
                sensuDevice = {node: results[0], events: results[1]};
              }
              redisClient.set('sensu:devices:' + hostname, JSON.stringify(sensuDevice));
              redisClient.expire('sensu:devices:' + hostname, 5);
              getDevCallback(err, sensuDevice);
            } else {
              logger.log('error', 'could not retrieve events and node from Sensu', { results: JSON.stringify(results) });
              getDevCallback(new Error('could not retrieve events and node from Sensu'));
            }
          }
        });
      }
    });
  };

  var getDevices = function(callback) {
    var request = require('request');
    request({url: config.sensu.uri + '/clients', json: true}, function (error, response, body) {
      if (error) {
        callback(error);
      } else {
        callback(null, body);
      }
    });
  };

  var getInfo = function(callback) {
    var request = require('request');
    request({url: config.sensu.uri + '/info', json: true}, function (error, response, body) {
      if (error) {
        callback(error);
      } else {
        callback(null, body);
      }
    });
  };

  var deleteEvent = function (client, check, deleteEventCallback) {
    var request = require('request');

    request({ method: 'DELETE', url: config.sensu.uri + '/events/' + client + '/' + check, json: true }, function (error, response) {
      if (error) {
        deleteEventCallback(error);
      } else if (response.statusCode === 200 || response.statusCode === 404) {
        deleteEventCallback(null, response.statusCode);
      } else if (response.statuscode === 500) {
        deleteEventCallback(new Error('failed to delete event'), response.statusCode);
      } else {
        deleteEventCallback(new Error('unknown response code ' + response.statusCode), response.statusCode);
      }
    });
  };

  var getSilencedClient = function(client, getSilencedClientsCallback) {
    var request = require('request');
    var path = 'silence/' + client;
    request({ url: app.get('sensu_uri') + '/stashes/' + path, json: true }, getSilencedClientsCallback);
  };

  var unSilenceClient = function (client, deleteCheckCallback) {
    var request = require('request');
    var path = "/silence/" + client;
    request({ method: 'DELETE', url: config.sensu.uri + '/stashes' + path, json: true }, function (error, msg, response) {
        deleteCheckCallback(error, response);
      }
    );
  };

  var unSilenceEvent = function (client, check, deleteCheckCallback) {
    var request = require('request');
    var path = "/silence/" + client + "/" + check;
    request({ method: 'DELETE', url: config.sensu.uri + '/stashes' + path, json: true }, function (error, msg, response) {
        deleteCheckCallback(error, response);
      }
    );
  };

  var deleteStash = function (path, deleteCheckCallback) {
    var request = require('request');
    request({ method: 'DELETE', url: config.sensu.uri + '/stashes' + path, json: true }, function (error, msg, response) {
        deleteCheckCallback(error, response);
      }
    );
  };

  module.getInfo = getInfo;
  module.getDevices = getDevices;
  module.getEvents = getEvents;
  module.getDeviceEvents = getDeviceEvents;
  module.getStashes = getStashes;
  module.getSilencedClient = getSilencedClient;
  module.silenceCheck = silenceCheck;
  module.silenceClient = silenceClient;
  module.unSilenceEvent = unSilenceEvent;
  module.unSilenceClient = unSilenceClient;
  module.deleteStash = deleteStash;
  module.deleteEvent = deleteEvent;
  module.getDevice = getDevice;

  return module;
};
