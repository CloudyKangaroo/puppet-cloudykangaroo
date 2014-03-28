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
config.crmModule.warmCache = false;
config.crmModule.ticketingHost = 'portal.contegix.com';
config.crmModule.ticketingPath = '/admin/supportmgr/ticket_view.php?ticket=';
config.mgmtDomain = '.contegix.mgmt';
config.log.accessLog = './access.log';
config.log.directory = process.env.LOG_DIR || '/var/log/cloudykangaroo';
config.metrics.interval = 15000;
config.log.level = 'debug';
config.log.screen = 'info';
config.development.log.level = 'info';
config.development.log.screen = 'debug';
config.production.log.level = 'hide';
config.production.log.screen = 'debug';

config.sensu.host = process.env.SENSU_HOST || 'sensu-server01.contegix.com';
config.sensu.port = process.env.SENSU_PORT || 4567;
config.sensu.uri = 'http://' + config.sensu.host + ':' + config.sensu.port;

config.puppetdb.host = process.env.PUPPETDB_HOST || 'puppet-db01.contegix.com';
config.puppetdb.port = process.env.PUPPETDB_PORT || 8080;
config.puppetdb.uri =  'http://' + config.puppetdb.host + ':' + config.puppetdb.port + '/v3';

config.redis.uri = process.env.REDIS_URI;
config.redis.host = process.env.REDIS_HOST || 'localhost';
config.redis.port = process.env.REDIS_PORT || 6379;
config.redis.db = process.env.REDIS_DB || 1;
config.redis.cache = process.env.REDIS_CACHE || 6;
config.redis.ttl = process.env.REDIS_TTL || 300; /*seconds*/

config.http.port = process.env.PORT || 3000;
config.cookie.secret = 'securit3333!!';
config.support = {};

config.roles = {};
config.roles.users = {};
config.roles.sales = {};
config.roles.support = {};
config.roles.admin = {};
config.roles.super = {};

config.roles.users.groups = ['users'];
config.roles.sales.groups = ['users'];
config.roles.support.groups = ['engineers'];
config.roles.admin.groups = ['leads'];
config.roles.super.groups = ['devops'];

config.roles.users.users = [];
config.roles.sales.users = [];
config.roles.support.users = [];
config.roles.admin.users = [];
config.roles.super.users = [];

var signatureTemplate = "Contegix | Technical Support\n";
signatureTemplate += "(314) 622-6200 ext. 3\n";
signatureTemplate += "https://portal.contegix.com\n";
signatureTemplate += "http://status.contegix.com\n";
signatureTemplate += "Twitter: @contegix | http://twitter.com/contegix\n";
signatureTemplate += "Twitter: @contegixstatus | http://twitter.com/contegixstatus\n";

config.support.signatureTemplate = signatureTemplate;

module.exports = config;
