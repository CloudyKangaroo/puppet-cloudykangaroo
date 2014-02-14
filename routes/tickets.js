module.exports = function (app, config, passport, redisClient) {

  app.get('/tickets'
    , function (req, res) {
      res.render('tickets',{ user: req.user, section: 'tickets', navLinks: config.navLinks.ubersmith });
    });

  app.get('/tickets/list'
    , app.locals.ensureAuthenticated
    , function (req, res) {
      res.render('tickets/list',{ user: req.user, section: 'tickets', navLinks: config.navLinks.ubersmith });
    });

  app.get('/tickets/new'
    , app.locals.ensureAuthenticated
    , function (req, res) {
      var _ = require('underscore');
        app.locals.ubersmith.getClients(function (err, clientList) {
           if (err) {
             res.send(500);
           } else {
             var clients = _.values(clientList);
             res.render('tickets/new',{ clients: clients, user: req.user, section: 'tickets', navLinks: config.navLinks.ubersmith });
           }
        });
    });

  app.get('/tickets/ticketid/:ticketid'
    , app.locals.ensureAuthenticated
    , function (req, res) {
      app.locals.ubersmith.getTicketbyTicketID(req.params.ticketid, function (err, ticket) {
        if (err)
        {
          res.send(500);
        } else {
          app.locals.ubersmith.getClientByID(ticket.client_id, function (err, client) {
            if (err)
            {
              res.send(500);
            } else {
              res.render('tickets/ticket',{ ticket: ticket, client: client, user: req.user, section: 'tickets', navLinks: config.navLinks.ubersmith });
            }
          });
        }
      });
    });
}