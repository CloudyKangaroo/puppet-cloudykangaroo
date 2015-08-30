module.exports = function (app, config, authenticator) {
  "use strict";
  app.get('/instrumentation/signage', authenticator.roleHandler.can('user'), function (req, res) {
    res.render('signage', { user:req.currentUser, title: 'Signage' });
  });
};
