module.exports = function (app, config, authenticator) {
  "use strict";
  app.get('/account', authenticator.roleManager.can('user'), function (req, res) {
    res.render('account', { user:req.currentUser, section: 'account', key: 'profile', navSections: req.navSections  });
  });

  app.get('/account/chat', authenticator.roleManager.can('user'), function (req, res) {
    res.render('account/chat', { user:req.currentUser, section: 'account', key: 'chat', navSections: req.navSections  });
  });

  app.post('/account/chat', authenticator.roleManager.can('user'), function (req, res) {
    res.render('account/chat', { user:req.currentUser, section: 'account', key: 'chat', navSections: req.navSections  });
  });
};
