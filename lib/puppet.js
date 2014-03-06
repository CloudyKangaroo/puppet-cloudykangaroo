module.exports = function(config, logger, redisClient) {
  var getDevice = function(hostname, getDevCallback) {
    var async = require('async');
    redisClient.get('puppet:devices:' + hostname, function (err, reply) {
      if (!err && reply)
      {
        logger.log('debug', 'got device from Redis');
        try {
          var parsedJSON = JSON.parse(reply)
        }
        catch (e) {
          logger.log('error', 'uncaught exception', { err: e});
        }
        getDevCallback(null, parsedJSON);
      } else {
        logger.log('debug', 'getting device from puppet');
        async.parallel([
          function (asyncCallback) {
            var request = require('request');
            var url = config.puppetdb.uri + '/nodes/' + hostname;
            request({ url: url, json: true }
              , function (error, response) {
                logger.log('verbose', 'response from puppet', {body: response.body, url: url});
                asyncCallback(error, response.body);
              });
          },
          function (asyncCallback) {
            var request = require('request');
            var url = config.puppetdb.uri + '/nodes/' + hostname + '/facts';
            request({ url: url, json: true }
              , function (error, response) {
                logger.log('verbose', 'response from puppet', {body: response.body, url: url});
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
              if (results[0].error)
              {
                var node = { name: hostname,
                  deactivated: null,
                  catalog_timestamp: '2014-01-22T04:11:05.562Z',
                  facts_timestamp: '2014-01-22T04:10:58.232Z',
                  report_timestamp: '2014-01-22T04:11:04.076Z' };
                var puppetDevice = {error: results[0].error, node: node, facts: []};
              } else {
                var facts = results[1];
                var factInfo = {};
                for (i=0; i<facts.length; i++)
                {
                  var fact = facts[i];
                  factInfo[fact.name] = fact.value;
                }
                var puppetDevice = {node: results[0], facts: factInfo, factsArray: facts};
              }
              redisClient.set('puppet:devices:' + hostname, JSON.stringify(puppetDevice));
              redisClient.expire('puppet:devices:' + hostname, 30)
              getDevCallback(err, puppetDevice);
            } else {
              getDevCallback(new Error('could not retrieve host and facts from Puppet'));
            }
          }
        });
      }
    });
  };
  module.getDevice = getDevice;
  return module;
};