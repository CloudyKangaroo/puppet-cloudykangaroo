module.exports = function (app, config, authenticator) {
  "use strict";
  app.get('/admin/configurationwizard', authenticator.roleHandler.can('user'), function (req, res) {
    res.render('configurationwizard', { user:req.currentUser, title: 'configurationwizard' });
  });
};
