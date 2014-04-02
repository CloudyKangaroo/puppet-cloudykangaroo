module.exports = function (config, logger, crmModule) {
  "use strict";

  var getEvents = function (getEventsCallback) {
    crmModule.getSensuEvents(1, 10023, function(err, deviceEvents) {
      crmModule.getSensuEvents(15, 0, function(err, events) {
        events.push(deviceEvents[0]);
        getEventsCallback(null, events);
      });
    });
  };

  var getDeviceEvents = function(hostname, callback) {

    crmModule.getDeviceByHostname(hostname, function (error, device) {
      if (error) {
        logger.log('error', 'Could not get device by hostname', {error: error.message});
        callback(error, null );
      } else if (!device || device === [] || device === '') {
        logger.log('error', 'No device found for that hostname', {hostname: hostname});
        callback({code: 404, message: 'No device found for: ' + hostname}, null);
      } else {
        logger.log('debug', 'Got device ' + device.deviceID, {device: device});
        crmModule.getSensuEvents(2, device.deviceID, function(error, deviceEvents) {
          if (error) {
            logger.log('error', 'Could not get device events', {deviceID: device.deviceID});
            callback(error);
          } else {
            logger.log('debug', 'Got Device Events', {deviceEvents: deviceEvents});
            callback(null, deviceEvents);
          }
        });
      }
    });
  };

  var getStashes = function(stashes, callback) {
    var ret = [
      {
        "path":"silence/jsklskwtrs-engage05.unittest.us/disk",
        "content":{
          "timestamp":1394450361,
          "user":"marta.wiliams",
          "ticketID":"12001"
        },
        "expire":118739
      }
    ];

    callback(null, ret);
    /*getStashes(stashes, function (err, reply) {
     console.log({function: 'getStashes', reply: JSON.stringify(reply)});
     callback(err, reply);
     });*/
  };

  var silenceCheck = function(user, client, check, expires, ticketID, callback) {
    silenceCheck(user, client, check, expires, ticketID, function (err, reply) {
      callback(err, reply);
    });
  };

  var silenceClient = function(user, client, check, expires, ticketID, callback) {
    silenceClient(user, client, check, expires, ticketID, function (err, reply) {
      callback(err, reply);
    });
  };

  var getDevice = function(hostname, callback) {
    var node = { address: 'unknown', name: hostname, safe_mode: 0, subscriptions: [], timestamp: 0 };
    var events = [ { output: "No Events Found", status: 1, issued: Date.now(), handlers: [], flapping: false, occurrences: 0, client: hostname, check: 'N/A'}];
    var sensuDevice = {error: 'No information is known about ' + hostname, events: events, node: node};
    callback(null, sensuDevice);
  };

  var getDevices = function(callback) {
    crmModule.getSensuDevices(function (err, reply) {
      callback(err, reply);
    });
  };

  var getInfo = function(callback) {
    var bodyJSON = "{\"sensu\":{\"version\":\"0.12.1\"},\"rabbitmq\":{\"keepalives\":{\"messages\":0,\"consumers\":2},\"results\":{\"messages\":0,\"consumers\":2},\"connected\":true},\"redis\":{\"connected\":true}}";
    var body = JSON.parse(bodyJSON);
    callback(null, body);
  };

  module.getInfo = getInfo;
  module.getEvents = getEvents;
  module.getDeviceEvents = getDeviceEvents;
  module.getStashes = getStashes;
  module.silenceCheck = silenceCheck;
  module.silenceClient = silenceClient;
  module.getDevice = getDevice;
  module.getDevices = getDevices;

  return module;
};
