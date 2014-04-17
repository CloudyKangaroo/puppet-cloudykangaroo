module.exports = function(config, logger) {
  "use strict";

  var cacheManager = require('cache-manager');
  var redisCache = {};

  if (process.env.NODE_ENV !== 'production') {
    redisCache = cacheManager.caching({store: 'memory', max: 1024*64 /*Bytes*/, ttl: 15 /*seconds*/});
  } else {
    var redisStore = require('./redis_store');
    redisCache = cacheManager.caching({store: redisStore, db: config.redis.cache, ttl: config.redis.ttl/*seconds*/});
  }

  var mockGetDevice = function(hostname, getDevCallback) {
    var node = {
      name: hostname,
      deactivated: null,
      catalog_timestamp: '2014-01-22T04:11:05.562Z',
      facts_timestamp: '2014-01-22T04:10:58.232Z',
      report_timestamp: '2014-01-22T04:11:04.076Z'
    };
    var puppetDevice = {error: '', node: node, facts: []};
    getDevCallback(null, puppetDevice);
  };

  var getDevice = function(hostname, getDevCallback) {
    redisCache.wrap('puppet:devices:' + hostname, function (cb) {
      getDeviceFromPuppetDB(hostname, cb);
    }, function (err, device) {
      getDevCallback(err, device);
    });
  };

  var getPuppetDBNode = function(hostname, callback) {
    var request = require('request');
    var url = config.puppetdb.uri + '/nodes/' + hostname;
    request({ url: url, json: true }, function (error, response) {
      if (error) {
        callback(error);
      } else {
        console.log(response);
        logger.log('verbose', 'response from puppet', {body: response.body, url: url});
        callback(null, response.body);
      }
    });
  };

  var getPuppetDBNodeFacts = function (hostname, callback) {
    var request = require('request');
    var url = config.puppetdb.uri + '/nodes/' + hostname + '/facts';
    request({ url: url, json: true }, function (error, response) {
      if (error) {
        callback(error);
      } else {
        logger.log('verbose', 'response from puppet', {body: response.body, url: url});
        callback(null, response.body);
      }
    });
  };

  var handlePuppetDBNode = function(hostname, results, callback) {
    if (results && results.length === 2)
    {
      var puppetDevice = {};
      if (results[0].error)
      {
        var node = {
          name: hostname,
          deactivated: null,
          catalog_timestamp: '2014-01-22T04:11:05.562Z',
          facts_timestamp: '2014-01-22T04:10:58.232Z',
          report_timestamp: '2014-01-22T04:11:04.076Z'
        };
        puppetDevice = {error: results[0].error, node: node, facts: []};
      } else {
        var facts = results[1];
        var factInfo = {};
        for (var i=0; i<facts.length; i++)
        {
          var fact = facts[i];
          factInfo[fact.name] = fact.value;
        }
        puppetDevice = {node: results[0], facts: factInfo, factsArray: facts};
      }
      callback(null, puppetDevice);
    } else {
      callback(new Error('could not retrieve host and facts from Puppet'));
    }
  };

  var getDeviceFromPuppetDB = function(hostname, getDevCallback) {
    logger.log('debug', 'getting device from puppet');
    var async = require('async');
    async.parallel([
      function (callback) {
        getPuppetDBNode(hostname, callback);
      },
      function (callback) {
        getPuppetDBNodeFacts(hostname, callback);
      }
    ], function (err, results) {
      if (err) {
        getDevCallback(err);
      } else {
        handlePuppetDBNode(hostname, results, getDevCallback);
      }
    });
  };

  if (process.env.NODE_ENV === 'test') {
    module.getDevice = mockGetDevice;
  } else {
    module.getDevice = getDevice;
  }

  return module;
};
