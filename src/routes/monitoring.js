module.exports = function (app, config, authenticator) {
  "use strict";
  
  app.get('/monitoring', authenticator.roleManager.can('view monitoring'), function (req, res) {
    app.locals.monModule.getInfo(function(error, body) {
      var moment = require('moment');
      if (!error) {
        app.locals.logger.log('debug', 'fetched data from Sensu');
        var sinceLastIncident = moment().diff(moment('01/01/2014 00:00:00',"DD/MM/YYYY HH:mm:ss"), 'days');
        var renderParams = {
          sinceLastIncident:  sinceLastIncident,
          info: body,
          user:req.currentUser,
          section: 'monitoring',
          key:  'dashboard',
          navSections: req.navSections
        };
        res.render('monitoring', renderParams);
      } else {
        res.send(500);
        app.locals.logger.log('error', 'error processing request', { error: error});
        app.locals.logger.trace(error);
      }
    });
  });

  app.get('/monitoring/events', authenticator.roleManager.can('view monitoring events'), function (req, res) {
    app.locals.monModule.getEvents(function(error, body) {
      if (!error) {
        app.locals.logger.log('debug', 'fetched data from Sensu');
        var renderParams = {
          events: body,
          user:req.currentUser,
          section: 'monitoring',
          key:  'events',
          navSections: req.navSections
        };
        res.render('monitoring/events', renderParams);
      } else {
        res.send(500);
        app.locals.logger.log('error', 'error processing request', { error: error});
        app.locals.logger.trace(error);
      }
    });
  });

  app.get('/monitoring/events/device/:hostname', authenticator.roleManager.can('view devices'), authenticator.roleManager.can('view monitoring'), function (req, res) {
    var hostname = req.params.hostname;
    app.locals.monModule.getDeviceEvents(hostname, function(error, body) {
      if (!error) {
        app.locals.logger.log('debug', 'fetched data from Sensu');
        var renderParams = {
          events: body,
          user:req.currentUser,
          section: 'monitoring',
          key:  'events',
          navSections: req.navSections
        };
        res.render('monitoring/events', renderParams);
      } else {
        res.send(500);
        app.locals.logger.log('error', 'error processing request', { error: error});
        app.locals.logger.trace(error);
      }
    });
  });

  app.get('/monitoring/stashes',authenticator.roleManager.can('view monitoring'), function (req, res) {
    res.render('monitoring/stashes', {user:req.currentUser, section: 'monitoring', key:  'stashes', navSections: req.navSections });
  });

  app.get('/monitoring/puppet',authenticator.roleManager.can('view monitoring'), function (req, res) {
    var hoursAgo = 10;
    var renderParams = {
      hoursAgo: hoursAgo,
      user:req.currentUser,
      section: 'monitoring',
      key:  'puppet',
      navSections: req.navSections
    };
    res.render('monitoring/puppet', renderParams);
  });

  app.get('/monitoring/clients',authenticator.roleManager.can('view monitoring'), function (req, res) {
    app.locals.monModule.getDevices(function (error, clients) {
      if (!error) {
        app.locals.logger.log('debug', 'fetched data from Sensu');
        var renderParams = {
          clients: clients,
          user:req.currentUser,
          section: 'monitoring',
          key:  'clients',
          navSections: req.navSections
        };
        res.render('monitoring/clients', renderParams);
      } else {
        res.send(500);
        app.locals.logger.log('error', 'error processing request', { error: error});
        app.locals.logger.trace(error);
      }
    });
  });

  app.get('/monitoring/list/clients',authenticator.roleManager.can('view monitoring'), function (req, res) {
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

  app.get('/monitoring/devices',authenticator.roleManager.can('view monitoring'), function (req, res) {
    res.render('monitoring/devices', {user:req.currentUser, section: 'monitoring', key:  'clients', navSections: req.navSections });
  });
};
