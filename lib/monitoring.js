module.exports = function (config, logger, crmModule, redisClient) {
  var getEvents = function (getEventsCallback ) {
    var _ = require('underscore');
    var request = require('request');

    if (crmModule.getEvents)
    {
      crmModule.getEvents(15, 0, getEventsCallback);
    } else {
      crmModule.getDeviceHostnames(function (err, deviceHostnames){
        if (deviceHostnames == null)
        {
          getEventsCallback(new Error, null);
        } else {
          request({ url: config.sensu.uri + '/events', json: true }, function (error, response, body) {
            if (!error && response.statusCode == 200) {
              var events = [];
              _.each(body, function(event) {
                _.defaults(event, deviceHostnames[event.client]);
                event['issued'] = getFormattedTimestamp(event['issued']);
                events.push(event);
              });
              logger.log('debug', 'fetched data from Sensu', { uri: config.sensu.uri + '/events'});
              getEventsCallback( error, events )
            } else {
              logger.log('error', 'Error processing request', { error: error, uri: config.sensu.uri + '/events'});
              getEventsCallback( error, null )
            }
          });
        }
      });
    }
  };

  var getDeviceEvents = function (hostname, getEventsCallback ) {
    var _ = require('underscore');
    var request = require('request');
    crmModulegetDeviceByHostname(hostname, function (error, device) {
      if (error) {

        logger.log('error', 'Could not get device by hostname', {error: error.message});
        getEventsCallback(error, null );

      } else if (!device || device == [] || device == '') {

        logger.log('error', 'No device found for that hostname', {hostname: hostname});
        getEventsCallback({code: 404, message: 'No device found for: ' + hostname}, null);

      } else if (crmModule.getEvents) {

        crmModule.getEvents(2, device.deviceID, getEventsCallback);

      } else {

        var url = config.sensu.uri + '/events/' + device.dev_desc + config.mgmtDomain;
        request({ url: url, json: true }, function (error, response, body) {
          if (!error && response.statusCode == 200) {
            var events = [];
            _.each(body, function(event) {
              _.defaults(event, device);
              event['issued'] = getFormattedTimestamp(event['issued']);
              events.push(event);
            });
            logger.log('debug', 'fetched data from Sensu', { uri: config.sensu.uri + '/events'});
            getEventsCallback( error, events )
          } else {
            logger.log('error', 'Error processing request', { error: error, uri: config.sensu.uri + '/events'});
            getEventsCallback( error, null )
          }
        });
      }
    });
  };
  var getStashes = function (stashes, getStashCallback) {
    var request = require('request');
    request({url: config.sensu.uri + '/stashes', json: true}
      , function (error, response, body) {
        if (error) {
          getStashCallback(error, body)
        } else {
          var re = new RegExp('^' + stashes);
          var filtered_response = body.filter(
            function (element) {
              return re.exec(element.path);
          });
          getStashCallback(error, filtered_response)
        }
      })
  };

  var silenceCheck = function (user, client, check, expires, ticketID, silenceCheckCallback) {
    var request = require('request');
    var reqBody = {
      path: "silence/" + client + "/" + check,
      content: { "timestamp": (Math.round(Date.now() / 1000)), "user": user , ticketID: ticketID},
      expire: expires
    };
    logger.log('silly', reqBody);
    request({ method: 'POST', url: config.sensu.uri + '/stashes', json: true, body: JSON.stringify(reqBody) }
      , function (error, msg, response) {
        logger.log('info', response);
        silenceCheckCallback(error, response)
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
    request({ method: 'POST', url: config.sensu.uri + '/stashes', json: true, body: JSON.stringify(reqBody) }
      , function (error, msg, response) {
        logger.log('debug', response);
        silenceClientCallback(error, response)
      }
    );
  };

  var getDevice = function(hostname, getDevCallback) {
    var async = require('async');
    redisClient.get('sensu:devices:' + hostname, function (err, reply) {
      if (!err && reply)
      {
        logger.log('debug', 'got device from Redis');
        try {
          var parsedJSON = JSON.parse(reply);
        }
        catch (e) {
          logger.log('error','uncaught exception');
        }
        getDevCallback(null, parsedJSON);
      } else {
        logger.log('debug', 'getting device from sensu');
        async.parallel([
          function (asyncCallback) {
            var request = require('request');
            request({ url: config.sensu.uri+ '/client/' + hostname, json: true }
              , function (error, response) {
                asyncCallback(error, response.body);
              });
          },
          function (asyncCallback) {
            var request = require('request');
            request({ url: config.sensu.uri + '/events/' + hostname, json: true }
              , function (error, response) {
                asyncCallback(error, response.body);
              });
          }
        ], function(err, results) {
          if (err)
          {
            getDevCallback(err);
          } else {
            if (results && results.length==2)
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

  module.getEvents = getEvents;
  module.getDeviceEvents = getDeviceEvents;
  module.getStashes = getStashes;
  module.silenceCheck = silenceCheck;
  module.silenceClient = silenceClient;
  module.getDevice = getDevice;
  return module;
};