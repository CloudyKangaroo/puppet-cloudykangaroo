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
        done(null, {services: [
                                    {
                                        "serviceName":"ZooKeeper",
                                        "NON":"3",
                                        "MPN":"2",
                                        "totalMemory":"6",
                                        "memoryThreshold":"0",
                                        "version":"cdh5.8.0"
                                        },
                                        {
                                        "serviceName":"HDFS Name Node",
                                        "NON":"2",
                                        "MPN":"4",
                                        "totalMemory":"8",
                                        "memoryThreshold":"0",
                                        "version":"cdh5.8.0"
                                        },
                                        {
                                        "serviceName":"HDFS ZKFC",
                                        "NON":"2",
                                        "MPN":"2",
                                        "totalMemory":"4",
                                        "memoryThreshold":"0",
                                        "version":"cdh5.8.0"
                                        },
                                        {
                                        "serviceName":"HDFS Journal Node",
                                        "NON":"3",
                                        "MPN":"2",
                                        "totalMemory":"6",
                                        "memoryThreshold":"0",
                                        "version":"cdh5.8.0"
                                        },
                                        {
                                        "serviceName":"HDFS Data Node",
                                        "NON":"3",
                                        "MPN":"8",
                                        "totalMemory":"24",
                                        "memoryThreshold":"2000",
                                        "version":"cdh5.8.0"
                                        },
                                        {
                                        "serviceName":"Hbase Master",
                                        "NON":"1",
                                        "MPN":"4",
                                        "totalMemory":"4",
                                        "memoryThreshold":"0",
                                        "version":"cdh5.8.0"
                                        },
                                        {
                                        "serviceName":"Hbase Regionserver",
                                        "NON":"3",
                                        "MPN":"16",
                                        "totalMemory":"48",
                                        "memoryThreshold":"2000",
                                        "version":"cdh5.8.0"
                                        },
                                        {
                                        "serviceName":"OpenTSDB (Write)",
                                        "NON":"3",
                                        "MPN":"4",
                                        "totalMemory":"12",
                                        "memoryThreshold":"2000",
                                        "version":"opentsdb-2.3.0"
                                        },
                                        {
                                        "serviceName":"OpenTSDB Docker (Read)",
                                        "NON":"6",
                                        "MPN":"2",
                                        "totalMemory":"12",
                                        "memoryThreshold":"1000",
                                        "version":"opentsdb-2.3.0"
                                        },
                                        {
                                        "serviceName":"MongoDB",
                                        "NON":"3",
                                        "MPN":"16",
                                        "totalMemory":"48",
                                        "memoryThreshold":"2000",
                                        "version":"mongodb-org-server-3.2.9"
                                        },
                                        {
                                        "serviceName":"ConfigDB",
                                        "NON":"3",
                                        "MPN":"2",
                                        "totalMemory":"6",
                                        "memoryThreshold":"2000",
                                        "version":"mongodb-org-server-3.2.9"
                                        },
                                        {
                                        "serviceName":"mongos",
                                        "NON":"1",
                                        "MPN":"1",
                                        "totalMemory":"1",
                                        "memoryThreshold":"0",
                                        "version":"mongodb-org-server-3.2.9"
                                        },
                                        {
                                        "serviceName":"Kafka",
                                        "NON":"3",
                                        "MPN":"4",
                                        "totalMemory":"12",
                                        "memoryThreshold":"2000",
                                        "version":"kafka_2.10-0.8.2.2"
                                        },
                                        {
                                        "serviceName":"Flume",
                                        "NON":"2",
                                        "MPN":"2",
                                        "totalMemory":"4",
                                        "memoryThreshold":"3000",
                                        "version":"apache-flume-1.7.0"
                                        },{
                                        "serviceName":"Redis",
                                        "NON":"1",
                                        "MPN":"2",
                                        "totalMemory":"2",
                                        "memoryThreshold":"0",
                                        "version":"redis-3.2.3"
                                        },
                                        {
                                        "serviceName":"OrientDB",
                                        "NON":"2",
                                        "MPN":"2",
                                        "totalMemory":"4",
                                        "memoryThreshold":"3000",
                                        "version":"OrientDB Server v2.2.10"
                                        },
                                        {
                                        "serviceName":"Graphs",
                                        "NON":"2",
                                        "MPN":"2",
                                        "totalMemory":"4",
                                        "memoryThreshold":"3000",
                                        "version":"latest"
                                        },
                                        {
                                        "serviceName":"TomEE",
                                        "NON":"2",
                                        "MPN":"4",
                                        "totalMemory":"8",
                                        "memoryThreshold":"3000",
                                        "version":"Apache Tomcat/7.0.68"
                                        },
                                        {
                                        "serviceName":"Datapipeline",
                                        "NON":"2",
                                        "MPN":"8",
                                        "totalMemory":"16",
                                        "memoryThreshold":"3000",
                                        "version":"latest"
                                        },
                                        {
                                        "serviceName":"Notification",
                                        "NON":"2",
                                        "MPN":"2",
                                        "totalMemory":"4",
                                        "memoryThreshold":"3000",
                                        "version":"latest"
                                        },
                                        {
                                        "serviceName":"lscontoller + sciencelogic plugin",
                                        "NON":"1",
                                        "MPN":"4",
                                        "totalMemory":"4",
                                        "memoryThreshold":"0",
                                        "version":"latest"
                                        },{
                                        "serviceName":"HAProxy (opentsdb)",
                                        "NON":"1",
                                        "MPN":"1",
                                        "totalMemory":"1",
                                        "memoryThreshold":"0",
                                        "version":"HA-Proxy version 1.5.4"
                                        },
                                        {
                                        "serviceName":"Nginx (tomee, flume)",
                                        "NON":"1",
                                        "MPN":"1",
                                        "totalMemory":"1",
                                        "memoryThreshold":"0",
                                        "version":"nginx-1.10.1"
                                        }
                                    ]});
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
