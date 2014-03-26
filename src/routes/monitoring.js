/* jshint unused: false */
module.exports = function (app, config, authenticator, redisClient) {
  "use strict";
  var passport = authenticator.passport;

  app.get('/monitoring', authenticator.roles.can('view monitoring'), function (req, res) {
    app.locals.monModule.getInfo(function(error, body) {
      var moment = require('moment');
      if (!error) {
        app.locals.logger.log('debug', 'fetched data from Sensu');
        var sinceLastIncident = moment().diff(moment('01/01/2014 00:00:00',"DD/MM/YYYY HH:mm:ss"), 'days');
        var renderParams = {
          sinceLastIncident:  sinceLastIncident,
          info: body,
          user:req.currentUser,
          section: 'info',
          navLinks: config.navLinks.monitoring
        };
        res.render('monitoring', renderParams);
      } else {
        res.send(500);
        var stackTrace = require('stack-trace');
        var trace = stackTrace.parse(error)
        app.locals.logger.log('error', 'error processing request', { error: error});
        app.locals.logger.trace(error);
      }
    });
  });

  app.get('/monitoring/events', authenticator.roles.can('view monitoring events'), function (req, res) {
    app.locals.monModule.getEvents(function(error, body) {
      if (!error) {
        app.locals.logger.log('debug', 'fetched data from Sensu');
        var renderParams = {
          events: body,
          user:req.currentUser,
          section: 'events',
          navLinks: config.navLinks.monitoring
        };
        res.render('monitoring/events', renderParams);
      } else {
        res.send(500);
        app.locals.logger.log('error', 'error processing request', { error: error});
        app.locals.logger.trace(error);
      }
    });
  });

  app.get('/monitoring/events/device/:hostname', authenticator.roles.can('view devices'), authenticator.roles.can('view monitoring'), function (req, res) {
    var hostname = req.params.hostname;
    app.locals.monModule.getDeviceEvents(hostname, function(error, body) {
      if (!error) {
        app.locals.logger.log('debug', 'fetched data from Sensu');
        var renderParams = {
          events: body,
          user:req.currentUser,
          section: 'events',
          navLinks: config.navLinks.monitoring
        };
        res.render('monitoring/events', renderParams);
      } else {
        res.send(500);
        app.locals.logger.log('error', 'error processing request', { error: error});
        app.locals.logger.trace(error);
      }
    });
  });

  app.get('/monitoring/stashes', app.locals.requireGroup('users'), function (req, res) {
    res.render('monitoring/stashes', {user:req.currentUser, section: 'stashes', navLinks: config.navLinks.monitoring });
  });

  app.get('/monitoring/puppet', app.locals.requireGroup('users'), function (req, res) {
    var hoursAgo = 10;
    var renderParams = {
      hoursAgo: hoursAgo,
      user:req.currentUser,
      section: 'puppet',
      navLinks: config.navLinks.monitoring
    };
    res.render('monitoring/puppet', renderParams);
  });

  app.get('/monitoring/clients', app.locals.requireGroup('users'), function (req, res) {
    app.locals.monModule.getDevices(function (error, clients) {
      if (!error) {
        app.locals.logger.log('debug', 'fetched data from Sensu');
        var renderParams = {
          clients: clients,
          user:req.currentUser,
          section: 'clients',
          navLinks: config.navLinks.monitoring
        };
        res.render('monitoring/clients', renderParams);
      } else {
        res.send(500);
        app.locals.logger.log('error', 'error processing request', { error: error});
        app.locals.logger.trace(error);
      }
    });
  });

  app.get('/monitoring/list/clients', app.locals.requireGroup('users'), function (req, res) {
    app.locals.monModule.getDevices(function (error, clients) {
      if (!error) {
        app.locals.logger.log('debug', 'fetched data from Sensu');
        for (var i=0; i<clients.length; i++)
        {
          var utils = require('../lib/utils');
          clients[i].timestamp = utils.getFormattedTimestamp(clients[i].timestamp);
        }
        res.type('application/json');
        res.send(JSON.stringify({ aaData: clients }));
      } else {
        res.send(500);
        res.send(500);
        app.locals.logger.log('error', 'error processing request', { error: error});
        app.locals.logger.trace(error);
      }
    });
  });

  app.get('/monitoring/devices', app.locals.requireGroup('users'), function (req, res) {
    res.render('monitoring/devices', {user:req.currentUser, section: 'clients', navLinks: config.navLinks.monitoring });
  });
};
