module.exports = function (app, config, authenticator) {
  "use strict";
  app.get('/sales', authenticator.roleManager.can('view accounts'), function (req, res) {
    var renderParams = {
      user:req.currentUser,
      section: 'monitoring',
      key:  'dashboard',
      navSections: config.navSections
    };
    res.render('sales', renderParams);
  });

  app.get('/sales/activity', authenticator.roleManager.can('submit lead activity'), function (req, res) {
    var renderParams = {
      user:req.currentUser,
      section: 'monitoring',
      key:  'dashboard',
      navSections: config.navSections
    };
    res.render('sales/activity', renderParams);
  });

  app.post('/sales/activity', authenticator.roleManager.can('submit lead activity'), function (req, res) {
    var renderParams = {
      user:req.currentUser,
      section: 'monitoring',
      key:  'dashboard',
      navSections: config.navSections
    };
    res.render('monitoring', renderParams);
  });
};
