var config = {};

config.navLinks = {
  account: [
    { label: 'Home', key: 'profile', path: '/account' },
    { label: 'Monitoring', key: 'monitoring', path: '/monitoring' },
    { label: 'Ubersmith', key: 'ubersmith', path: '/ubersmith' },
    { label: 'Chat', key: 'chat', path: '/account/chat' },
    { label: 'Logout', key: 'logout', path: '/account/logout' }
  ],
  ubersmith: [
    { label: 'Dashboard', key: 'dashboard', path: '/ubersmith' },
    { label: 'Customers', key: 'clients', path: '/ubersmith/clients' },
    { label: 'Devices', key: 'devices', path: '/ubersmith/devices' },
    { label: 'Tickets', key: 'tickets', path: '/ubersmith/tickets' },
    { label: 'Monitoring', key: 'monitoring', path: '/monitoring' }
  ],
  monitoring: [
    { label: 'Home', key: 'info', path: '/monitoring' },
    { label: 'Puppet', key: 'puppet', path: '/monitoring/puppet' },
    { label: 'Events', key: 'events', path: '/monitoring/events' },
    { label: 'Hosts', key: 'clients', path: '/monitoring/clients' },
    { label: 'Checks', key: 'checks', path: '/monitoring/checks' },
    { label: 'Stashes', key: 'stashes', path: '/monitoring/stashes' },
    { label: 'Ubersmith', key: 'ubersmith', path: '/ubersmith' }
  ]
};

config.sensu = {};
config.redis = {};
config.puppetdb = {};
config.http = {};
config.cookie = {};
config.log = {};
config.development = {};
config.production = {};
config.production.log = {};
config.development.log = {};
config.metrics = {};
config.crmModule = {};
config.crmModule.warm_cache = true;
config.mgmtDomain = '.contegix.mgmt';
config.log.access_log = './access.log';
config.log.directory = process.env.LOG_DIR || '/var/log/cloudykangaroo';
config.metrics.interval = 15000;
config.log.level = 'info';
config.log.screen = 'debug';
config.development.log.level = 'info';
config.development.log.screen = 'debug';
config.production.log.level = 'warn';
config.production.log.screen = 'hide';

config.sensu.host = process.env.SENSU_HOST || 'sensu-server01.contegix.com';
config.sensu.port = process.env.SENSU_PORT || 4567;

config.puppetdb.host = process.env.PUPPETDB_HOST || 'puppet-db01.contegix.com';
config.puppetdb.port = process.env.PUPPETDB_PORT || 8080;

config.redis.uri = process.env.REDIS_URI;
config.redis.host = process.env.REDIS_HOST || 'localhost';
config.redis.port = process.env.REDIS_PORT || 6379;
config.redis.db = process.env.REDIS_DB || 1;

config.http.port = process.env.PORT || 3000;
config.cookie.secret = 'securit3333!!';
config.support = {};

signatureTemplate = "Contegix | Technical Support\n";
signatureTemplate += "(314) 622-6200 ext. 3\n";
signatureTemplate += "https://portal.contegix.com\n";
signatureTemplate += "http://status.contegix.com\n";
signatureTemplate += "Twitter: @contegix | http://twitter.com/contegix\n";
signatureTemplate += "Twitter: @contegixstatus | http://twitter.com/contegixstatus\n";

config.support.signatureTemplate = signatureTemplate;

module.exports = config;
