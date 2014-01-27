module.exports = function (app, config, passport, redisClient) {
  app.get('/puppet/facts/:fact'
    , app.locals.requireGroup('users')
    , function (req, res) {
      var request = require('request');
      request({ url: app.get('puppetdb_uri') + '/facts/' + req.params.fact, json: true }
        , function (error, response, body) {
          if (error)
          {
            app.locals.logger.log('debug', 'failed to get data from PuppetDB', { uri: app.get('puppetdb_uri') + '/facts/' + req.params.fact});
            res.send(500);
          } else {
            app.locals.logger.log('debug', 'fetched data from PuppetDB', { uri: app.get('puppetdb_uri') + '/facts/' + req.params.fact});
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.write(JSON.stringify(body));
            res.end();
          }
        })
    });

  app.get('/puppet/nodes/:node'
    , app.locals.requireGroup('users')
    , function (req, res) {
      var request = require('request');
      request({ url: app.get('puppetdb_uri') + '/nodes/' + req.params.node, json: true }
        , function (error, response, body) {
          if (error)
          {
            app.locals.logger.log('debug', 'failed to get data from PuppetDB', { uri: app.get('puppetdb_uri') + '/facts/' + req.params.node});
            res.send(500);
          } else {
            app.locals.logger.log('debug', 'fetched data from PuppetDB', { uri: app.get('puppetdb_uri') + '/nodes/' + req.params.node + '/facts'});
            var puppetNode = body;
            puppetNode.catalog_time = app.locals.getFormattedISO8601(puppetNode.catalog_timestamp);
            puppetNode.facts_time = app.locals.getFormattedISO8601(puppetNode.facts_timestamp);
            puppetNode.report_time = app.locals.getFormattedISO8601(puppetNode.report_timestamp);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.write(JSON.stringify({ aaData: body}));
            res.end();
          }
        })
    });

  app.get('/puppet/facts/mactohosts/:macaddress'
    , app.locals.requireGroup('users')
    , function (req, res) {
      var request = require('request');
      var url =  app.get('puppetdb_uri') + '/facts?query=["~","name", "macaddress_.*"]'
      request({ url:url, json: true}
        , function (error, response, body) {
          app.locals.logger.log('debug', 'fetched data from PuppetDB', { uri: url});
          var facts = body;
          var returns = new Array();
           res.send(body);
          for (var i = 0; i<facts.length; i++)
          {
              if (facts[i].value == req.params.macaddress)
              {
                returns.push({ hostname: facts[i].certname, interface: facts[i].name.substring(11) });
              }
          }
          var resBody = JSON.stringify(returns);
          res.writeHead(200, { 'Content-Length': resBody.length, 'Content-Type': 'application/json' });
          res.write(resBody);
          res.end();

        });
    });

  /*
  var request = require('request');
  request({ url: app.get('puppetdb_uri') + '/nodes/' + device.dev_desc + '.contegix.mgmt/facts', json: true}
    , function (error, response, body) {
      logger.log('debug', 'fetched data from PuppetDB', { uri: app.get('puppetdb_uri') + '/nodes/' + req.params.node + '/facts'});
      console.log(body);
      saveValue('devices:deviceid:' + device_id + ':facts', body);
    });

  */
  app.get('/puppet/nodes/:node/facts'
    , app.locals.requireGroup('users')
    , function (req, res) {
      var request = require('request');
      request({ url: app.get('puppetdb_uri') + '/nodes/' + req.params.node + '/facts', json: true}
        , function (error, response, body) {
          app.locals.logger.log('debug', 'fetched data from PuppetDB', { uri: app.get('puppetdb_uri') + '/nodes/' + req.params.node + '/facts'});
          var resBody = JSON.stringify({ aaData: body });
          res.writeHead(200, { 'Content-Length': resBody.length, 'Content-Type': 'application/json' });
          res.write(resBody);
          res.end();
          });
      });
}
