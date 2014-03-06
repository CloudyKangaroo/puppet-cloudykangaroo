/* jshint unused: false */
module.exports = function(logger, config) {
  "use strict";
  /*
  var metrics = require('measured');
  var collection = new metrics.Collection('http');
  var rps = collection.meter('requestsPerSecond');
  var timer = collection.timer('requestTime');

  setInterval(function() {
    var metricslogger = ctxlog('metrics', 'debug', config.log.directory, {level: 'error'});
    var collectionJSON = collection.toJSON();
    metricslogger.log('data', 'metrics output', { collection: collectionJSON, type: 'metrics'});
  }, config.metrics.interval || 15000);
  */
  var reqWrapper = function (req, res, next) {

    // Perform some work at the beginning of every request

    //rps.mark();

    res.locals.token = require('./utils').uid(16);

    logger.req = req;

    // To track response time
    req._rlStartTime = new Date();

    //var stopwatch = timer.start();

    req.on('end', function() {
      logger.log('debug', 'ending request', {});
      //stopwatch.end();
    });

    req.on('error', function(err) {
      logger.log('error', 'Error in Express Request', { error: err });
    });

    // Save the real end that we will wrap
    // http://stackoverflow.com/questions/8719626/adding-a-hook-to-globally-log-all-node-http-responses-in-node-js-express
    // MIT License https://github.com/mathrawka/express-request-logger/blob/master/LICENSE

    var rEnd = res.end;

    // The following function will be executed when we send our response:
    res.end = function(chunk, encoding) {
      // Do the work expected
      res.end = rEnd;
      res.end(chunk, encoding);

      // And do the work we want now (logging!)
      req.kvLog.status = res.statusCode;
      req.kvLog.response_time = (new Date() - req._rlStartTime);
      req.kvLog.originalURL = req.originalURL || req.url;
      req.kvLog.referer = (req.referer)?req.referer:'none';
      req.kvLog.remoteAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      req.kvLog.userAgent = req.useragent.source;
      req.kvLog.isBot = req.useragent.isBot;
      req.kvLog.OS = req.useragent.OS;
      req.kvLog.Browser = req.useragent.Browser;
      req.kvLog.Platform = req.useragent.Platform;
      req.kvLog.isMobile = req.useragent.isMobile;
      req.kvLog.isDesktop = req.useragent.isDesktop;

      delete req.kvLog._rlLevel;

      var entry = {};
      Object.keys(req.kvLog).forEach(function(key) {
        var value = req.kvLog[key];
        if (key !== 'date')
        {
          entry[key] = value;
        }
      });

      logger.log('data', 'request analytics', entry);
    };

    next();
  };

  module.reqWrapper = reqWrapper;
  //module.collection = collection;
  //module.rps = rps;
  //module.timer = timer;
  return module;
};
