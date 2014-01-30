module.exports = function (app, config, passport, redisClient) {
  var async = require('async');
  var request = require('request')

  app.get('/ubersmith'
    , app.locals.ensureAuthenticated
    , function (req, res) {

      redisClient.mget(['support.ticket_count.low', 'support.ticket_count.normal', 'support.ticket_count.high', 'support.ticket_count.urgent', 'support.ticket_count.total', 'uber.event_list', 'support.ticket_count'], function(err, reply){
        if (!reply) {
          app.locals.logger.log('error', 'redis mget error', { err: err});
          res.send(500);
        } else {
          //app.locals.logger.log('debug', 'redis mget reply', { reply: reply });
          //var ticketLow = reply[0].replace(/"/g,'');
          //var ticketNormal = reply[1].replace(/"/g,'');
          //var ticketHigh = reply[2].replace(/"/g,'');
          //var ticketUrgent = reply[3].replace(/"/g,'');
          //var ticketTotal = reply[4].replace(/"/g,'');
          //var eventList = reply[5];
          var ticketLow = 0;
          var ticketNormal = 0;
          var ticketHigh = 0;
          var ticketUrgent = 0;
          var ticketTotal = 0;
          var eventList = {};
          res.render('ubersmith', {ticket_count: { low: ticketLow, normal: ticketNormal, high: ticketHigh, urgent: ticketUrgent, total: ticketTotal}, event_list: eventList, user: req.user, section: 'dashboard', navLinks: config.navLinks.ubersmith });
        }
      });
    });

  app.get('/ubersmith/tickets'
    , app.locals.ensureAuthenticated
    , function (req, res) {
        res.render('ubersmith/tickets',{ user: req.user, section: 'tickets', navLinks: config.navLinks.ubersmith });
      });

  app.get('/ubersmith/tickets/ticketid/:ticketid'
    , app.locals.ensureAuthenticated
    , function (req, res) {
      app.locals.ubersmith.getTicketbyTicketID(req.params.ticketid, function (err, ticket) {
        if (err)
        {
          res.send(500);
        } else {
          res.render('ubersmith/ticket',{ ticket: ticket, user: req.user, section: 'tickets', navLinks: config.navLinks.ubersmith });
        }
      });
    });


  // Device Browser
  app.get('/ubersmith/devices'
    , app.locals.requireGroup('users')
    , function (req, res) {
      app.locals.ubersmith.getDeviceTypeList(function(err, deviceTypeList) {
        if (err) {
          res.send(500);
        } else {
          res.render('ubersmith/devices', { device_types: deviceTypeList, user:req.user, section: 'devices', navLinks: config.navLinks.ubersmith });
        }
      });
    });

  // Used to view a single device
  app.get('/ubersmith/devices/deviceid/:deviceid'
    , app.locals.requireGroup('users')
    , function (req, res) {
      app.locals.ubersmith.getDeviceByID(req.params.deviceid
        , function (error, uberDevice) {
          if (!uberDevice)
          {
            app.locals.logger.log('error', 'Failed to retrieve device from Ubersmith', { error: error, deviceid: req.params.deviceid });
            res.send(404);
          } else {
            var async = require('async');
            var hostname =  uberDevice.dev_desc + '.contegix.mgmt';

            async.parallel([
              function (asyncCallback) {
                app.locals.ubersmith.getDeviceByID(req.params.deviceid, asyncCallback);
              },
              function (asyncCallback) {
                app.locals.getPuppetDevice(hostname, function (error, puppetDevice){
                     asyncCallback(error, puppetDevice)
                });
              },
              function (asyncCallback) {
                app.locals.getSensuDevice(hostname, asyncCallback);
              }
            ], function(err, results) {
               if (err)
              {
                app.locals.logger.log('error', 'could not get all device data ' + err.message, {err: err})
                res.send(500);
              } else {
                if (results && results.length==3)
                {
                  var _ = require('underscore');
                  var uberDevice = results[0];
                  var puppetDevice = results[1];
                  var sensuDevice = results[2];

                  _.defaults(uberDevice, {dev: 0, dev_desc: 'unknown', metadata: {},
                    devtype_group_name: 'unknown', type: 'unknown', active: 0,
                    location: 'unknown', parent_desc: 'unknown', clientid: 0,
                    listed_company: 'none', email: '', phone: ''});
                  _.defaults(uberDevice.metadata, {management_level: 'unknown'});

                  _.defaults(sensuDevice, {node: {}, events: []});
                  _.defaults(sensuDevice.events, { output: "No Events Found", status: 1, issued: Date.now(), handlers: [], flapping: false, occurrences: 0, client: hostname, check: 'N/A'});
                  _.defaults(sensuDevice.node, {name: '', address: ''});

                  _.defaults(puppetDevice, {catalog_timestamp: 0, facts_timestamp: 0, report_timestamp: 0, facts: {}});
                  _.defaults(puppetDevice.facts, {operatingsystem: '', operatingsystemrelease: '', kernel:  '',
                    kernelrelease: '', uptime: '', manufacturer: '', productname: '', serialnumber: '', memoryfree: '',
                    memorytotal: '', physicalprocessorcount: 0, processorcount: 0, processor0: '', interface_mgmt: '', interface_public: ''});

                  res.render('ubersmith/device', { puppetDevice: puppetDevice, uberDevice: uberDevice, sensuDevice: sensuDevice, user:req.user, section: 'devices', navLinks: config.navLinks.ubersmith });
                } else {
                  app.locals.logger.log('error', 'results were not found, or not enough results returned', {results: JSON.stringify(results)});
                  res.send(500);
                }
              }
            });
          }
        }
      );
    }
  );

  app.get('/ubersmith/devices/hostname/:hostname'
    , app.locals.requireGroup('users')
    , function (req, res) {
      app.locals.ubersmith.getDeviceByHostname(req.params.hostname
        , function (error, uberDevice) {
          if (!uberDevice)
          {
            app.locals.logger.log('error', 'Failed to retrieve device from Ubersmith', { error: error, deviceid: req.params.deviceid });
            res.send(404);
          } else {
            res.redirect('/ubersmith/devices/deviceid/' + uberDevice.dev);
          }
        }
      );
    }
  );

  app.get('/ubersmith/clients'
    , app.locals.requireGroup('users')
    , function (req, res) {
      res.render('ubersmith/clients', { user:req.user, section: 'clients', navLinks: config.navLinks.ubersmith });
    });

  app.get('/ubersmith/clients/clientid/:clientid'
    , app.locals.requireGroup('users')
    , function (req, res) {
        var _ = require('underscore');
        var async = require('async');
        async.parallel([
          function(callback){
            app.locals.ubersmith.getClientByID(req.params.clientid, callback);
          },
          function(callback){
            app.locals.ubersmith.getContactsbyClientID(req.params.clientid, callback);
          }
        ],
          function(err, results) {
            if (err)
            {
              res.send(500);
            } else {
              client = results[0];
              client.contacts = results[1];
              res.render('ubersmith/client', { clientid: req.params.clientid, client: client, user:req.user, section: 'clients', navLinks: config.navLinks.ubersmith });
            }
          });
    });
}