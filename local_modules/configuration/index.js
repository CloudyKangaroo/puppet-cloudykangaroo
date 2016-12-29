module.exports = function (app, config, authenticator) {
    "use strict";

    var moduleName = 'features-configuration';

    app.locals.addMenuSection(moduleName, 'Admin', 'admin', ['users']);
    app.locals.addMenuContent({ section: moduleName, label: 'View Config', key: 'viewer', path: '/admin/configuration' });
    app.locals.addMenuContent({ section: moduleName, label: 'Config Wizard', key: 'wizard', path: '/admin/configuration/wizard' });

    authenticator.roleManager.registerDefaultAction(moduleName, 'view current configuration', 'View the current Management Node Configuration', ['users']);
    authenticator.roleManager.registerDefaultAction(moduleName, 'run configuration wizard', 'Run the Configuration Wizard', ['users']);
    authenticator.roleManager.registerDefaultAction(moduleName, 'modify configuration', 'Modify the Management Node Configuration', ['users']);

    var getConfiguration = function (done) {
        done(null, {});
    };

    // Read Only users can GET the current configuration
    app.get('/admin/configuration',  authenticator.roleHandler.can('view current configuration'), function (req, res) {
        getConfiguration(function(error, configuration) {
            if (error) {
                res.send(500);
            } else {
                var renderParams = {
                    configuration: configuration,
                    user:req.currentUser,
                    section: 'admin',
                    key: 'viewer',
                    navSections: req.navSections
                };
                res.render(__dirname + '/views/viewer', renderParams);
            }
        });
    });

    // Admin users can run the configuration wizard
    app.get('/admin/configuration/wizard', authenticator.roleHandler.can('run configuration wizard'), function (req, res) {
        getConfiguration(function(error, configuration) {
            if (error) {
                res.send(500);
            } else {
                var renderParams = {
                    configuration: configuration,
                    user:req.currentUser,
                    section: 'admin',
                    key: 'wizard',
                    navSections: req.navSections
                };
                res.render(__dirname + '/views/wizard', renderParams);
            }
        });
    });

    // Admin users can view the configuration
    app.get('/api/v1/admin/configuration', authenticator.roleHandler.can('run configuration wizard'), function (req, res) {
        getConfiguration(function(error, configuration) {
            if (error) {
                res.send(500);
            } else {
                res.type('application/json');
                res.send(configuration);
            }
        });
    });

    // Admin users post new configuration
    app.post('/admin/configuration', authenticator.roleHandler.can('modify configuration'), function (req, res) {
        updateConfiguration(req.body.configuration, function(error, configuration) {
            if (error) {
                res.send(500);
            } else {
                res.redirect('/admin/configuration');
            }
        });
    });
};
