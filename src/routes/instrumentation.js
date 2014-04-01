module.exports = function (app, config, authenticator) {
  "use strict";
  app.get('/instrumentation/signage', authenticator.roleManager.can('user'), function (req, res) {
    res.render('signage', { user:req.currentUser, title: 'Signage' });
  });
};
