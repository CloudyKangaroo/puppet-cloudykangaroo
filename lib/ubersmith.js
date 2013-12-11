/**
 * Ubersmith Integration
 */
var ubersmith = require('ubersmith');
var uberData = new Array();

ubersmith.uberAuth = UberAuth;

ubersmith.uberRefreshData('device.list');
ubersmith.uberRefreshData('client.list');

ubersmith.uberScheduleRefresh('device.list', 1);
ubersmith.uberScheduleRefresh('client.list', 10);

ubersmith.on('ready.device.list',
  function(body) {
    uberData['device.list'] = body;
    console.log('uberData device.list populated');
  }
);

ubersmith.on('failed.device.list',
  function(err) {
    console.log(err);
  }
);

ubersmith.on('ready.client.list',
  function(body) {
    uberData['client.list'] = body;
  }
);

ubersmith.on('failed.client.list',
  function(err) {
    console.log(err);
  }
);

/**
 * End Ubersmith
 */
