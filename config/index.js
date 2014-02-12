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
config.metrics = {};
config.ubersmith = {};
config.ubersmith.warm_cache = true;
config.log.access_log = './access.log';
config.log.directory = process.env.LOG_DIR || '/var/log/cloudykangaroo';
config.metrics.interval = 15000;
config.log.level = 'info';
config.sensu.host = process.env.SENSU_HOST || 'sensu-server01.contegix.com';
config.sensu.port = process.env.SENSU_PORT || 4567;

config.puppetdb.host = process.env.PUPPETDB_HOST || 'puppet-db01.contegix.com';
config.puppetdb.port = process.env.PUPPETDB_PORT || 8080;

config.redis.uri = process.env.REDIS_URI;
config.redis.host = process.env.REDIS_HOST || 'localhost';
config.redis.port = process.env.REDIS_PORT || 6379;
config.redis.db = process.env.REDIS_DB || 1;

config.http.port = process.env.PORT || 3000;
config.cookie.secret = 'supersecure';

module.exports = config;
