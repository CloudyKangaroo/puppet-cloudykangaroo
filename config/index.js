var config = {}

config.navLinks = {
  account: [
    { label: 'Home', key: 'profile', path: '/account' },
    { label: 'Monitoring', key: 'monitoring', path: '/monitoring' },
    { label: 'Ubersmith', key: 'ubersmith', path: '/ubersmith' },
    { label: 'Logout', key: 'logout', path: '/account/logout' }
  ],
  ubersmith: [
    { label: 'Dashboard', key: 'dashboard', path: '/ubersmith' },
    { label: 'Customers', key: 'clients', path: '/ubersmith/customers' },
    { label: 'Devices', key: 'devices', path: '/ubersmith/devices' },
    { label: 'Tickets', key: 'tickets', path: '/ubersmith/tickets' }
  ],
  monitoring: [
    { label: 'Home', key: 'info', path: '/monitoring' },
    { label: 'Events', key: 'events', path: '/monitoring/events' },
    { label: 'Clients', key: 'clients', path: '/monitoring/clients' },
    { label: 'Checks', key: 'checks', path: '/monitoring/checks' },
    { label: 'Stashes', key: 'stashes', path: '/monitoring/stashes' }
  ] 
}

config.sensu = {};
config.redis = {};
config.http = {};
config.cookie = {};
config.log = {};

config.log.access_log = './access.log';

config.sensu.host = process.env.SENSU_HOST || 'sensu-server01.contegix.com';
config.sensu.port = process.env.SENSU_PORT || 4567;
config.redis.uri = process.env.REDIS_URI;
config.redis.host = process.env.REDIS_HOST || 'localhost';
config.redis.port = process.env.REDIS_PORT || 6379;
config.http.port = process.env.PORT || 3000;
config.cookie.secret = 'supersecure';

module.exports = config;
