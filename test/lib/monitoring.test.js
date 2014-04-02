/*global it:false */
/*global describe:false */
process.env.NODE_ENV = 'test';
process.env.LOG_DIR = './';

var credentials = require('../../src/config/system-dev-credentials')();

var config = {};

config.mgmtDomain = '.unittest.us';

config.log = {};
config.log.level = 'hide';
config.log.screen = 'hide';
config.log.directory = '/tmp';


config.redis = {};
config.redis.port = '6379';
config.redis.host = 'localhost';
config.redis.db = 1;

config.sensu = {};
config.sensu.host = 'localhost';
config.sensu.port = 4567;
config.sensu.uri = 'http://' + config.sensu.host + ':' + config.sensu.port;

config.puppetdb = {};
config.puppetdb.host = 'localhost';
config.puppetdb.port = 8080;
config.puppetdb.uri =  'http://' + config.puppetdb.host + ':' + config.puppetdb.port + '/v3';

var logger = {};

logger.log = function () {
  "use strict";
};

var redis = require("fakeredis");
var redisClient = redis.createClient(config.redis.port, config.redis.host);

var crmAuth = credentials.crmAuth();

require('../../src/lib/nock')(config, logger);

/* Kick off the Ubersmith background update, pulls from Ubersmith and stores in Redis */
try {
  var crmModuleConfig = {
    mgmtDomain: config.mgmtDomain,
    redisPort: config.redis.port,
    redisHost: config.redis.host,
    redisDb: config.redis.db,
    uberAuth: crmAuth,
    logLevel: config.log.level,
    logDir: config.log.directory,
    warm_cache: false
  };

  var crmModule = {};

  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test')
  {
    crmModule = require('cloudy-localsmith')(crmModuleConfig);
  } else {
    crmModule = require('cloudy-ubersmith')(crmModuleConfig);
  }
}
catch (e) {

  logger.log('error', 'Could not initialize CRM Module', { error: e.message });
  throw e;
}

var assert = require('assert');

/*
 Need tests for:
 handle, is, can, use
 */

describe("monModule getInfo", function (){
  "use strict";
  it('should return sensu server info', function () {
    var monModule = require('../../src/lib/monitoring')(config, logger, crmModule, redisClient);
    monModule.getInfo(function (err, info) {
      assert.equal(null, err);
      assert.equal("0.12.1", info.sensu.version);
    });
  });
});

describe("MOCK monModule getInfo", function (){
  "use strict";
  it('should return sensu server info', function () {
    var monModule = require('../../src/lib/mockMonitoring')(config, logger, crmModule, redisClient);
    monModule.getInfo(function (err, info) {
      assert.equal(null, err);
      assert.equal("0.12.1", info.sensu.version);
    });
  });
});
