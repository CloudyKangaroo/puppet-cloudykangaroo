module.exports = function (app, config, authenticator) {
  "use strict";

  app.locals.addMenuContent({ section: 'sales', label: 'Dashboard', key: 'dashboard', path: '/sales' });
  app.locals.addMenuContent({ section: 'sales', label: 'New Activity', key: 'activity', path: '/sales/activity' });
  app.locals.addMenuContent({ section: 'sales', label: 'Recent Activities', key: 'activityview', path: '/sales/activity/view' });
  app.locals.addMenuContent({ section: 'sales', label: 'My Accounts', key: 'accounts', path: '/sales/accounts' });

  app.locals.leadActivity = [];

  app.get('/sales', authenticator.roleManager.can('view accounts'), function (req, res) {
    var renderParams = {
      user:req.currentUser,
      section: 'sales',
      key:  'dashboard',
      navSections: req.navSections
    };
    res.render('sales', renderParams);
  });

  app.get('/sales/accounts', authenticator.roleManager.can('view accounts'), function (req, res) {
    app.locals.crmModule.getClientByKeyword('innovate', function (err, clients) {
      if (err) {
        res.send(500);
      } else {
        console.log(clients);
        var renderParams = {
          user:req.currentUser,
          section: 'sales',
          key:  'activity',
          clients: clients,
          navSections: req.navSections
        };
        res.render('sales/accounts', renderParams);
      }
    });
  });

  app.get('/sales/activity', authenticator.roleManager.can('submit lead activity'), function (req, res) {
    app.locals.crmModule.getClients(function (err, leads) {
      if (err) {
        res.send(500);
      } else {
        var renderParams = {
          user:req.currentUser,
          section: 'sales',
          key:  'activity',
          leads: leads,
          navSections: req.navSections
        };
        res.render('sales/activity', renderParams);
      }
    });
  });

  app.get('/sales/activity/view', authenticator.roleManager.can('submit lead activity'), function (req, res) {
    var renderParams = {
      user:req.currentUser,
      section: 'sales',
      key:  'activityview',
      activities: app.locals.leadActivity,
      navSections: req.navSections
    };
    res.render('sales/activity/view', renderParams);
  });

  app.post('/sales/activity', authenticator.roleManager.can('submit lead activity'), function (req, res) {
    console.log(req.body);
    console.log(req.currentUser);
    app.locals.leadActivity.push({ formData: req.body, user: req.currentUser});
    res.redirect('/sales/activity/view');
  });
};
