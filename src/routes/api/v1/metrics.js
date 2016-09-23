/* jshint unused: false, sub: true */
module.exports = function (app, config, authenticator) {
  "use strict";
  var utils = require('../../../lib/utils');

  app.get('/api/v1/metrics/metric/:metric', authenticator.roleHandler.can('use api'), function (req, res) {
    //TODO: validate the input dude
    app.locals.instModule.getMetricUID(req.params.metric, function (err, metricUID) {
      if (err) {
        res.send(500);
      } else {
        app.locals.instModule.getMetric(metricUID.uid, function (err, metricObj) {
          var resBody = JSON.stringify(metricObj);
          res.type('application/json');
          res.send(resBody);
        });
      }
    });
  });

  app.post('/api/v1/metrics/metric/:metric', function (req, res) {
    //TODO: validate the input dude
    app.locals.instModule.getMetricUID(req.params.metric, function (err, metricUID) {
      if (err) {
        res.send(500);
      } else {
        var resBody = JSON.stringify(metricUID);
        res.type('application/json');
        res.send(resBody);
      }
    });
  });

  app.put('/api/v1/metrics/metric/:metric', function (req, res) {
    //TODO: validate the input dude
    app.locals.instModule.getMetricUID(req.params.metric, function (err, metricUID) {
      if (err) {
        res.send(500);
      } else {
        var resBody = JSON.stringify(metricUID);
        res.type('application/json');
        res.send(resBody);
      }
    });
  });

  app.put('/api/v1/metrics/uid/:uid', function (req, res) {
    var metricMetaData = req.body; //TODO: validate the input dude
    app.locals.instModule.setMetricMetadata(req.params.uid, metricMetaData, function (err, metricObj) {
      console.log(metricObj);
      var resBody = JSON.stringify(metricObj);
      res.type('application/json');
      res.send(resBody);
    });
  });

  app.post('/api/v1/metrics/uid/:uid', function (req, res) {
    var metricMetaData = req.body; //TODO: validate the input dude
    app.locals.instModule.setMetricMetadata(req.params.uid, metricMetaData, function (err, metricObj) {
      var resBody = JSON.stringify(metricObj);
      res.type('application/json');
      res.send(resBody);
    });
  });
};
