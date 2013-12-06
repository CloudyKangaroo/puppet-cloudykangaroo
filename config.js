var config = {}

config.navLinks = [
  { label: 'Home', key: 'info', path: '/monitoring' },
  { label: 'Events', key: 'events', path: '/monitoring/events' },
  { label: 'Clients', key: 'clients', path: '/monitoring/clients' },
  { label: 'Checks', key: 'checks', path: '/monitoring/checks' },
  { label: 'Stashes', key: 'stashes', path: '/monitoring/stashes' }
]

config.sensu = {};
config.redis = {};
config.http = {};
config.cookie = {};

config.sensu.host = process.env.SENSU_HOST || '192.168.65.102';
config.sensu.port = process.env.SENSU_PORT || 4567;
config.redis.uri = process.env.REDIS_URI;
config.redis.host = process.env.REDIS_HOST || 'localhost';
config.redis.port = process.env.REDIS_PORT || 6379;
config.http.port = process.env.PORT || 3000;
config.cookie.secret = 'supersecure';

module.exports = config;
