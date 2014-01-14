var ubersmith = require('ubersmith');
var redis = require('redis');
var ctxlog = require('../../ctxlog');
var logger = ctxlog('uberdata', 'error');

var outstandingEvents = 0;
var redisClient;

module.exports = UberData;

/**
 * Uses populateUberData function to request, and schedule refreshes of cached Ubersmith Data
 * @param redisPort
 * @param redisHost
 * @param UberAuth
 * @constructor
 */
function UberData(redisPort, redisHost, UberAuth) {
  redisClient = redis.createClient(redisPort, redisHost);
  ubersmith.uberAuth = UberAuth;
  populateUberData('support.ticket_count', '&priority=0&type=ClientAll', 'support.ticket_count.low');
  populateUberData('support.ticket_count', '&priority=1&type=ClientAll', 'support.ticket_count.normal');
  populateUberData('support.ticket_count', '&priority=2&type=ClientAll', 'support.ticket_count.high');
  populateUberData('support.ticket_count', '&priority=3&type=ClientAll', 'support.ticket_count.urgent');
  populateUberData('support.ticket_count', '&type=ClientAll', 'support.ticket_count.total');

  populateUberData('client.list');
  populateUberData('device.list', '', 'device.list', '30');
  populateUberData('device.type_list');
  populateUberData('event_list');
  populateUberData('support.ticket_list', '', 'support.ticket_list', '60');
  populateUberData('support.ticket_count', '', 'support.ticket_count', '60');
}


/**
 * Used to store data from Ubersmith API in local Redis Cache
 * @param method
 * @param params
 * @param key
 * @param interval
 */
function populateUberData(method, params, key, interval) {
  outstandingEvents++;

  if (arguments.length == 1) {
    var params = '';
    var key = method;
    var interval = 300;
  }

  if (arguments.length == 2) {
    var key = method;
    var interval = 300;
  }

  if (arguments.length == 3) {
    var interval = 300;
  }

  ubersmith.uberRefreshData(method, params, key);
  ubersmith.uberScheduleRefresh(method, interval, params, key);

  ubersmith.on('ready.' + key, function (body, key) {
    storeUberData(body, key)
  });

  ubersmith.on('failed.' + key, function (err) {
     uberError(err)
  });
}

/**
 * Handles Error from Ubersmith Module
 * @param err
 */
function uberError(err) {

  if (outstandingEvents > 0) {
    outstandingEvents--;
  }

  logger.log('error', err);

  if (outstandingEvents == 0 && !exports.done)
  {
    exports.done = true;
    logger.log('info', 'Uberdata module failed to load.');
  }
}

/**
 * Handles returned data from Ubersmith Module
 * @param body
 * @param key
 */
function storeUberData(body, key) {
  if (outstandingEvents > 0) {
    outstandingEvents--;
  }

  //logger.log('debug', 'Storing ' + JSON.stringify(body.data).length + ' bytes as ' + key);

  redisClient.set(key
    , JSON.stringify(body.data)
    , function (err, res) {
      if (err) {
        logger.log('error', 'Redis set value for key ' + key + ' failed.', err);
      } else {
        logger.log('debug', 'Saved ' + key);
      }
    });

  if (outstandingEvents == 0 && !exports.done)
  {
    exports.done = true;
    logger.log('info', 'Uberdata module loaded');
  }
  switch (key)
  {
    case 'device.list':
      var deviceList = body.data;
      var deviceListbyCompany = {};
      var deviceListbyClientID = {};
      var deviceListbyLocation = {};
      Object.keys(deviceList).forEach(function(device_id) {
        device = deviceList[device_id];

        if (device.rack_code && device.rack_code != 'null')
        {
          if (!('racks' in deviceListbyLocation))
          {
            deviceListbyLocation['racks'] = {};
          }
          if (!(device.rack_code in deviceListbyLocation['racks']))
          {
            deviceListbyLocation['racks'][device.rack_code] = new Array();
          }
          deviceListbyLocation['racks'][device.rack_code].push(device);
        }

        if (device.fac_id && device.fac_id != 'null')
        {
          if (!(device.fac_id in deviceListbyLocation))
          {
            deviceListbyLocation[device.fac_id] = {};
          }
          if (!(device.zone_id in deviceListbyLocation[device.fac_id]))
          {
            deviceListbyLocation[device.fac_id][device.zone_id] = {};
          }
          if (!(device.cage_id in deviceListbyLocation[device.fac_id][device.zone_id]))
          {
            deviceListbyLocation[device.fac_id][device.zone_id][device.cage_id] = {};
          }
          if (!(device.row_id in deviceListbyLocation[device.fac_id][device.zone_id][device.cage_id]))
          {
            deviceListbyLocation[device.fac_id][device.zone_id][device.cage_id][device.row_id] = {};
          }
          if (!(device.rack_id in deviceListbyLocation[device.fac_id][device.zone_id][device.cage_id][device.row_id]))
          {
            deviceListbyLocation[device.fac_id][device.zone_id][device.cage_id][device.row_id][device.rack_id] = {};
          }
          if (!(device.rack_pos in deviceListbyLocation[device.fac_id][device.zone_id][device.cage_id][device.row_id][device.rack_id]))
          {
            deviceListbyLocation[device.fac_id][device.zone_id][device.cage_id][device.row_id][device.rack_id][device.rack_pos] = new Array();
          }
          deviceListbyLocation[device.fac_id][device.zone_id][device.cage_id][device.row_id][device.rack_id][device.rack_pos].push(device);
        }

        if (device.company && device.company != 'null')
        {
          if (!(device.company in deviceListbyCompany))
          {
            deviceListbyCompany[device.company] = Array();
          }
          deviceListbyCompany[device.company].push(device);
        }

        if (device.clientid && device.clientid != 'null')
        {
          if (!(device.clientid in deviceListbyClientID))
          {
            deviceListbyClientID[device.clientid] = Array();
          }
          deviceListbyClientID[device.clientid].push(device);
        }
      });
      redisClient.set('device.list.clientid'
        , JSON.stringify(deviceListbyClientID)
        , function (err, res) {
            if (err) {
              logger.log('error', 'Redis set value failed.', err);
            } else {
              logger.log('debug', 'Saved device.list.clientid', res);
            }
        });

      redisClient.set('device.list.company'
        , JSON.stringify(deviceListbyCompany)
        , function (err, res) {
          if (err) {
            logger.log('error', 'Redis set value failed.', err);
          } else {
            logger.log('debug', 'Saved device.list.company');
          }
        });

      redisClient.set('device.list.location'
        , JSON.stringify(deviceListbyLocation)
        , function (err, res) {
          if (err) {
            logger.log('error', 'Redis set value failed.', err);
          } else {
            logger.log('debug', 'Saved device.list.location');
          }
        });
      break;
    default:
      break;
  }
}