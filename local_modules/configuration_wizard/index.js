module.exports = function (app, config, authenticator) {
    "use strict";

//    var lib = require('./lib');

    var moduleName = 'configuration_wizard';

    app.locals.addMenuSection(moduleName, 'Configuration Wizard', 'configuration_wizard', ['users']);
    app.locals.addMenuContent({ section: moduleName, label: 'Node MGT', key: 'nodeMgt', path: '/configuration_wizard/nodeMgt' });

    authenticator.roleManager.registerDefaultAction(moduleName, 'view configuration_wizard nodeMgt', 'Create new Leads', ['configuration_wizard']);

    app.get('/configuration_wizard', authenticator.roleHandler.can('view configuration_wizard'), function (req, res) {
        var ticketLow = 0;
        var ticketNormal = 0;
        var ticketHigh = 0;
        var ticketUrgent = 0;
        var ticketTotal = 0;
        var eventList = {};
        var renderParams = {
            ticket_count: {
                low: ticketLow,
                normal: ticketNormal,
                high: ticketHigh,
                urgent: ticketUrgent,
                total: ticketTotal
            },
            event_list: eventList,
            user: req.currentUser,
            section: 'configuration_wizard',
            key: 'nodeMgt',
            navSections: req.navSections
        };
        res.render(__dirname + '/views', renderParams);
    });

    // Device Browser
    app.get('/configuration_wizard/nodeMgt',  authenticator.roleHandler.can('view configuration_wizard nodeMgt'), function (req, res) {
        app.locals.crmModule.getDeviceTypeList(function(err, deviceTypeList) {
            if (err) {
                res.send(500);
            } else {
                var renderParams = {
                    device_types: deviceTypeList,
                    user:req.currentUser,
                    section: 'configuration_wizard',
                    key: 'nodeMgt',
                    navSections: req.navSections
                };
                res.render(__dirname + '/views/nodeMgt', renderParams);
            }
        });
    });
};
