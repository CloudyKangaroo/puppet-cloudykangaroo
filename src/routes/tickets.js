/* jshint unused: false */
module.exports = function (app, config, authenticator, redisClient) {
  "use strict";
  var passport = authenticator.passport;
  app.get('/tickets', function (req, res) {
    res.render('tickets',{ user: req.currentUser, section: 'tickets', navLinks: config.navLinks.ubersmith });
  });

  app.get('/tickets/list', app.locals.ensureAuthenticated, function (req, res) {
    res.render('tickets/list',{ user: req.currentUser, section: 'tickets', navLinks: config.navLinks.ubersmith });
  });

  app.get('/tickets/new', app.locals.ensureAuthenticated, function (req, res) {
    var _ = require('underscore');
    app.locals.crmModule.getClients(function (err, clientList) {
      if (err) {
        res.send(500);
      } else {
        var clients = _.values(clientList);
        var renderParams = {
          clients: clients,
          user: req.currentUser,
          section: 'tickets',
          navLinks: config.navLinks.ubersmith
        };
        res.render('tickets/new',renderParams);
      }
    });
  });

  app.get('/tickets/ticketid/:ticketid', app.locals.ensureAuthenticated, function (req, res) {
    app.locals.crmModule.getTicketbyTicketID(req.params.ticketid, function (err, ticket) {
      if (err)
      {
        res.send(500);
      } else {
        app.locals.crmModule.getClientByID(ticket.client_id, function (err, client) {
          if (err)
          {
            res.send(500);
          } else {
            var renderParams = {
              ticket: ticket,
              client: client,
              user: req.currentUser,
              section: 'tickets',
              navLinks: config.navLinks.ubersmith
            };
            res.render('tickets/ticket', renderParams);
          }
        });
      }
    });
  });
};
