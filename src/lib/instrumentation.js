module.exports = function(config, logger) {
  "use strict";

  var openTSDBBase = 'http://' + config.metrics.host + ':' + config.metrics.port + '/api';
  var getMetricUID = function (metric, getUIDCallback) {
    var request = require('request');
    var metricURL = openTSDBBase + '/uid/assign?metric=' + metric;
    request({ url: metricURL, json:true}, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        getUIDCallback(null, body);
      } else if (!error && response.statusCode === 400) {
        var UIDerror = body.metric_errors[metric];
        //Name already exists with UID: 0000E5
        var arr = UIDerror.split(":");
        var metricUID = arr[1].trim();
        getUIDCallback(null, {uid: metricUID, metric: metric});
      } else {
        logger.log('error', 'Error processing request', { error: error, uri: metricURL });
        getUIDCallback( error, null );
      }
    });
  };

  var getMetric = function (metricUID, getUIDCallback) {
    var request = require('request');
    var metricURL = openTSDBBase + '/uid/uidmeta?uid=' + metricUID + '&type=metric';
    request({ url: metricURL, json:true}, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        getUIDCallback(null, body);
      } else {
        logger.log('error', 'Error processing request', { error: error, uri: metricURL });
        getUIDCallback( error, null );
      }
    });
  };

  var setMetricMetadata = function(metricUID, metricMetaData, setMetadataCallback) {
    var request = require('request');
    var metricURL = openTSDBBase + '/uid/uidmeta?uid=' + metricUID + '&type=metric&method=post';
    request.post({ url: metricURL, body: metricMetaData, json:true}, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        setMetadataCallback(null, body);
      } else {
        logger.log('error', 'Error processing request', { error: error, uri: metricURL });
        setMetadataCallback( error, null );
      }
    });
  };

  module.getMetricUID = getMetricUID;
  module.getMetric = getMetric;
  module.setMetricMetadata = setMetricMetadata;
  return module;
};