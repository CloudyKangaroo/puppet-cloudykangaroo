module.exports = function (app, config, authenticator) {
  "use strict";

  app.locals.addMenuContent({ section: 'sales', label: 'Dashboard', key: 'dashboard', path: '/sales' });
  app.locals.addMenuContent({ section: 'sales', label: 'New Activity', key: 'activity', path: '/sales/activity' });
  app.locals.addMenuContent({ section: 'sales', label: 'My Accounts', key: 'accounts', path: '/sales/accounts' });

  app.get('/sales', authenticator.roleManager.can('view accounts'), function (req, res) {
    var renderParams = {
      user:req.currentUser,
      section: 'sales',
      key:  'dashboard',
      navSections: req.navSections
    };
    res.render('sales', renderParams);
  });

  app.get('/sales/activity', authenticator.roleManager.can('submit lead activity'), function (req, res) {
    var renderParams = {
      user:req.currentUser,
      section: 'sales',
      key:  'activity',
      navSections: req.navSections
    };
    res.render('sales/activity', renderParams);
  });

  app.post('/sales/activity', authenticator.roleManager.can('submit lead activity'), function (req, res) {
    var renderParams = {
      user:req.currentUser,
      section: 'sales',
      key:  'activity',
      navSections: req.navSections
    };
    res.render('monitoring', renderParams);
  });
};
