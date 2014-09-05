var config = {};

config.sensu = {};
config.redis = {};
config.puppetdb = {};
config.http = {};
config.cookie = {};
config.log = {};
config.development = {};
config.production = {};
config.test = {};
config.production.log = {};
config.development.log = {};
config.test.log = {};
config.metrics = {};
config.graphiteEvent = {};
config.credentials = {};
config.credentials.class = process.env.CREDS_CLASS || './config/system-dev-credentials';

config.crmModule = {};
config.crmModule.warmCache = false;
config.crmModule.ticketingHost = 'localhost';
config.crmModule.ticketingPath = '/ticketing/ticket_view.php?ticket=';
config.crmModule.class = process.env.CRM_CLASS || 'cloudy-localsmith';

config.monModule = {};
config.monModule.class = process.env.MON_CLASS || './lib/monitoring';

config.mgmtDomain = process.env.MGMT_DOMAIN || '.example.org';

config.test.log.directory = process.env.LOG_DIR || process.cwd();
config.test.log.accessLog = process.env.ACCESS_LOG || config.test.log.directory + '/access.log';
config.test.log.level = 'hide';
config.test.log.screen = 'hide';

config.development.log.directory = process.env.LOG_DIR || process.cwd();
config.development.log.accessLog = process.env.ACCESS_LOG || config.development.log.directory + '/access.log';
config.development.log.level = 'hide';
config.development.log.screen = 'debug';

config.production.log.directory = process.env.LOG_DIR || '/var/log/cloudykangaroo';
config.production.log.accessLog = process.env.ACCESS_LOG || config.production.log.directory + '/access.log';
config.production.log.level = 'hide';
config.production.log.screen = 'debug';

config.metrics.interval = 15000;

config.sensu.host = process.env.SENSU_HOST || 'localhost';
config.sensu.port = process.env.SENSU_PORT || 4567;
config.sensu.uri = 'http://' + config.sensu.host + ':' + config.sensu.port;
config.sensu.pluginPath = '/opt/contegix/sensu/etc/sensu/plugins/';

config.puppetdb.host = process.env.PUPPETDB_HOST || 'localhost';
config.puppetdb.port = process.env.PUPPETDB_PORT || 8080;
config.puppetdb.uri =  'http://' + config.puppetdb.host + ':' + config.puppetdb.port + '/v3';

config.graphiteEvent.enabled = false;
config.graphiteEvent.urlPrefix = 'http://graphite.example.com/render/?';
config.graphiteEvent.targetTemplate = 'sensu.statsd.applications.counters.sensu.events..clientName.*.checkName';
config.graphiteEvent.severities = [ 'warning', 'critical', 'unknown' ];
config.graphiteEvent.timeRange = "-8h";
config.graphiteEvent.height = "450";

config.redis.uri = process.env.REDIS_URI;
config.redis.host = process.env.REDIS_HOST || 'localhost';
config.redis.port = process.env.REDIS_PORT || 6379;
config.redis.db = process.env.REDIS_DB || 1;
config.redis.cache = process.env.REDIS_CACHE || 6;
config.redis.ttl = process.env.REDIS_TTL || 300; /*seconds*/
config.redis.class = process.env.REDIS_CLASS || 'redis';
config.http.port = process.env.PORT || 3000;
config.cookie.secret = 'CHANGETHISPLEASE!!!';
config.USE_NOCK = process.env.USE_NOCK || 'false';
config.support = {};



config.roles = {
  users: {
    name: 'users',
    description: 'Minimum access, required to login',
    groups: ['users'],
    users: ['bob']
  },
  sales: {
    name: 'sales',
    description: 'Provides access to lead and account management functionality. Also provides read-only access to monitoring.',
    groups: ['sales'],
    users: ['bob']
  },
  executive: {
    name: 'executive',
    description: 'Provides access to executive reporting and dashboards.',
    groups: ['execs'],
    users: ['bob']
  },
  helpdesk: {
    name: 'helpdesk',
    description: 'Provides access to helpdesk functionality. Also provides read-only access to monitoring.',
    groups: ['engineers'],
    users: ['bob']
  },
  monitoring: {
    name: 'monitoring',
    description: 'Provides additional access to monitoring systems.',
    groups: ['engineers', 'execs'],
    users: ['bob']
  },
  admin: {
    name: 'admin',
    description: 'Provides full access to sales, monitoring and helpdesk functionality.',
    groups: ['admin'],
    users: ['bob']
  },
  super: {
    name: 'super',
    description: 'Provides access to administrative functions.',
    groups: ['ops'],
    users: ['bob']
  }
};

var signatureTemplate = "Ticket submitted via CloudyKangaroo - https://github.com/CloudyKangaroo/CloudyKangaroo";

config.support.signatureTemplate = signatureTemplate;

module.exports = config;
