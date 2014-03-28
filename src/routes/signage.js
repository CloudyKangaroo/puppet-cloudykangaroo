module.exports = function (app, config, authenticator) {
  "use strict";
  app.get('/signage', authenticator.roleManager.can('user'), function (req, res) {
    res.render('signage', { user:req.currentUser, title: 'Signage' });
  });
};
