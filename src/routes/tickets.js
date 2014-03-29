module.exports = function (app, config, authenticator) {
  "use strict";
  app.get('/tickets', authenticator.roleManager.can('view tickets'), function (req, res) {
    res.render('tickets',{ user: req.currentUser, section: 'tickets', key: 'dashboard', navSections: config.navSections });
  });

  app.get('/tickets/list', authenticator.roleManager.can('view tickets'), function (req, res) {
    res.render('tickets/list',{ user: req.currentUser, section: 'helpdesk', key: 'list', navSections: config.navSections });
  });

  app.get('/tickets/new', authenticator.roleManager.can('view tickets'), function (req, res) {
    var _ = require('underscore');
    app.locals.crmModule.getClients(function (err, clientList) {
      if (err) {
        res.send(500);
      } else {
        var clients = _.values(clientList);
        var renderParams = {
          clients: clients,
          user: req.currentUser,
          section: 'helpdesk',
          key: 'new',
          navSections: config.navSections
        };
        res.render('tickets/new',renderParams);
      }
    });
  });

  app.get('/tickets/ticketid/:ticketid', authenticator.roleManager.can('view tickets'), function (req, res) {
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
              section: 'helpdesk',
              key: 'tickets',
              navSections: config.navSections
            };
            res.render('tickets/ticket', renderParams);
          }
        });
      }
    });
  });
};