/*
HTTP Mockup Manager
*/
var nock = require('nock');
nock.recorder.rec();
nockOptions = {allowUnmocked: true};
nock('http://sensu-server.contegix.com:4567')
  .get('/info')
  .reply(200, "{\"sensu\":{\"version\":\"0.12.1\"},\"rabbitmq\":{\"keepalives\":{\"messages\":43523,\"consumers\":2},\"results\":{\"messages\":3450,\"consumers\":2},\"connected\":false},\"redis\":{\"connected\":true}}", { 'content-type': 'application/json;charset=utf-8',
  'content-length': '168',
  connection: 'keep-alive',
  server: 'thin 1.5.0 codename Knife' });

nock('http://puppet-db01.contegix.com:8080')
  .get('/v3/events?query=[%22and%22,%20[%22=%22,%20%22status%22,%20%22failure%22],%20[%22~%22,%20%22certname%22,%20%22contegix.mgmt$%22],[%22%3E%22,%20%22timestamp%22,%20%222014-02-09T06:19:07-06:00%22]]')
  .reply(200, "[ ]", { date: 'Sun, 09 Feb 2014 22:19:07 GMT',
  'content-type': 'application/json; charset=utf-8',
  'content-length': '3',
  server: 'Jetty(7.x.y-SNAPSHOT)' });

nock('http://puppet-db01.contegix.com:8080')
  .get('/v3/aggregate-event-counts?query=[%22%3E%22,%20%22timestamp%22,%20%222014-02-09T12:19:07-06:00%22]&summarize-by=certname')
  .reply(200, "{\n  \"successes\" : 1,\n  \"failures\" : 0,\n  \"noops\" : 0,\n  \"skips\" : 0,\n  \"total\" : 1\n}", { date: 'Sun, 09 Feb 2014 22:19:07 GMT',
  'content-type': 'application/json; charset=utf-8',
  'content-length': '84',
  server: 'Jetty(7.x.y-SNAPSHOT)' });

nock('http://puppet-db01.contegix.com:8080')
  .get('/v3/metrics/mbean/com.puppetlabs.puppetdb.query.population%3Atype%3Ddefault%2Cname%3Dnum-nodes')
  .reply(200, "{\n  \"Value\" : 739\n}", { date: 'Sun, 09 Feb 2014 22:19:07 GMT',
  'content-type': 'application/json; charset=utf-8',
  'content-length': '19',
  server: 'Jetty(7.x.y-SNAPSHOT)' });

nock('http://puppet-db01.contegix.com:8080')
  .get('/v3/metrics/mbean/com.puppetlabs.puppetdb.query.population%3Atype%3Ddefault%2Cname%3Dnum-resources')
  .reply(200, "{\n  \"Value\" : 63276\n}", { date: 'Sun, 09 Feb 2014 22:19:07 GMT',
  'content-type': 'application/json; charset=utf-8',
  'content-length': '21',
  server: 'Jetty(7.x.y-SNAPSHOT)' });

nock('http://puppet-db01.contegix.com:8080')
  .get('/v3/metrics/mbean/com.puppetlabs.puppetdb.query.population%3Atype%3Ddefault%2Cname%3Davg-resources-per-node')
  .reply(200, "{\n  \"Value\" : 85.62381596752368\n}", { date: 'Sun, 09 Feb 2014 22:19:07 GMT',
  'content-type': 'application/json; charset=utf-8',
  'content-length': '33',
  server: 'Jetty(7.x.y-SNAPSHOT)' });

nock('http://puppet-db01.contegix.com:8080')
  .get('/v3/metrics/mbean/com.puppetlabs.puppetdb.query.population%3Atype%3Ddefault%2Cname%3Dpct-resource-dupes')
  .reply(200, "{\n  \"Value\" : 0.6128705986471964\n}", { date: 'Sun, 09 Feb 2014 22:19:07 GMT',
  'content-type': 'application/json; charset=utf-8',
  'content-length': '34',
  server: 'Jetty(7.x.y-SNAPSHOT)' });
