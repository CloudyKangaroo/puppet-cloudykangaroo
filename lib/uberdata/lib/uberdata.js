var ubersmith = require('ubersmith');
var redis = require('redis');
var ctxlog = require('../../ctxlog');
var logger = ctxlog('uberdata', 'info');

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
  populateUberData('support.ticket_count', '&queue=1&priority=0&type=ClientAll', 'support.ticket_count.low');
  populateUberData('support.ticket_count', '&queue=1&priority=1&type=ClientAll', 'support.ticket_count.normal');
  populateUberData('support.ticket_count', '&queue=1&priority=2&type=ClientAll', 'support.ticket_count.high');
  populateUberData('support.ticket_count', '&queue=1&priority=3&type=ClientAll', 'support.ticket_count.urgent');
  populateUberData('support.ticket_count', '&queue=1&type=ClientAll', 'support.ticket_count.total');

  populateUberData('client.list');
  populateUberData('device.list', '', 'device.list', '30');
  populateUberData('device.type_list');
  populateUberData('uber.event_list');
  populateUberData('support.ticket_list', '&queue=1&metadata=1&type=ClientAll', 'support.ticket_list', '60');
  populateUberData('support.ticket_count', '&queue=1&metadata=1&type=ClientAll', 'support.ticket_count', '60');
  //populateUberData('client.contact_list', '&client_id=104050&metadata=1&contact_active=1', 'client.contact_list_104050', '3600');

  redisClient.get('client.list', function (err, reply) {
    if (!reply) {
      logger.log('error', 'could not get client list');
    } else {
      var clientList= JSON.parse(reply);
      Object.keys(clientList).forEach(function(clientid) {
        if (clientList[clientid].company != 'REMOVED' && clientList[clientid].active == 1)
        {
          populateUberData('client.contact_list', '&client_id=' + clientid + '&metadata=1&contact_active=1', 'client.contact_list_' + clientid, '3600');
        }
      });
    }});
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

  logger.log('debug', 'requesting ' + key);
  ubersmith.uberRefreshData(method, params, key);
  ubersmith.uberScheduleRefresh(method, interval, params, key);

  ubersmith.on('ready.' + key, function (body, key) {
    storeUberData(body, key)
  });

  ubersmith.on('failed.' + key, function (err, key) {
     uberError(err, key)
  });
}

/**
 * Handles Error from Ubersmith Module
 * @param err
 */
function uberError(err, key) {

  if (outstandingEvents > 0) {
    outstandingEvents--;
  }

  logger.log('error', 'Got error on ' + key, { error: err });

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
        logger.log('debug', 'Saved ' + key, {length: JSON.stringify(body.data).length});
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
      var deviceListbyHostname = {};

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


        if (device.dev_desc && device.dev_desc != 'null')
        {
          if (!(device.dev_desc + '.contegix.mgmt' in deviceListbyHostname))
          {
            deviceListbyHostname[device.dev_desc + '.contegix.mgmt'] = Array();
          }
          deviceListbyHostname[device.dev_desc + '.contegix.mgmt'].push(device);
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
              logger.log('debug', 'Saved device.list.clientid', {});
            }
        });

      redisClient.set('device.list.company'
        , JSON.stringify(deviceListbyCompany)
        , function (err, res) {
          if (err) {
            logger.log('error', 'Redis set value failed.', err);
          } else {
            logger.log('debug', 'Saved device.list.company', {});
          }
        });

      redisClient.set('device.list.location'
        , JSON.stringify(deviceListbyLocation)
        , function (err, res) {
          if (err) {
            logger.log('error', 'Redis set value failed.', err);
          } else {
            logger.log('debug', 'Saved device.list.location', {});
          }
        });

      redisClient.set('device.list.hostname'
        , JSON.stringify(deviceListbyHostname)
        , function (err, res) {
          if (err) {
            logger.log('error', 'Redis set value failed.', err);
          } else {
            logger.log('debug', 'Saved device.list.hostname', {});
          }
        });
      break;
    default:
      break;
  }
}
