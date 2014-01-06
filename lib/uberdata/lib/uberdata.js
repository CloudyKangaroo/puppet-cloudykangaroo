/**
 * Ubersmith Integration
 */
var ubersmith = require('ubersmith');

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

function populateUberData(method, params, key, interval) {
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
function uberError(err) {
  console.log(err);
}
function storeUberData(body, key) {
  console.log('Storing ' + JSON.stringify(body.data).length + ' bytes as ' + key);
//  redisClient.del(key);
  redisClient.set(key, JSON.stringify(body.data));
}

/**
 * End Ubersmith
 */