nock('http://sensu-server.contegix.com:4567',nockOptions)
  .get('/info')
  .reply(200, "{\"sensu\":{\"version\":\"0.12.1\"},\"rabbitmq\":{\"keepalives\":{\"messages\":0,\"consumers\":2},\"results\":{\"messages\":0,\"consumers\":2},\"connected\":true},\"redis\":{\"connected\":true}}", { 'content-type': 'application/json;charset=utf-8',
    'content-length': '168',
    connection: 'keep-alive',
    server: 'thin 1.5.0 codename Knife' });

nock('http://sensu-server.contegix.com:4567')
  .get('/events')
  .reply(200, "[{\"output\":\"DellPhysicalDisk WARNING: \\nSlot:1 Status:OK Manufacturer:SEAGATE Model:ST3300656SS Serial:3QP07E7S\\nSlot:0 Status:Non-critical Manufacturer:SEAGATE Model:ST3300657SS Serial:3SJ0CZXG\\n\",\"status\":1,\"issued\":1391976612,\"handlers\":[\"default\"],\"flapping\":false,\"occurrences\":5029,\"client\":\"dmeautomotive01.contegix.mgmt\",\"check\":\"dell_physical_disks\"},{\"output\":\"CheckHTTP CRITICAL: 200, did not find /Point your rss reader at this link/ in 11214 bytes: <!DOCTYPE html>\\n<html lang=\\\"en\\\">\\n<head>\\n    <meta charset=\\\"utf-8\\\" />\\n    <title>Log in as a Bamboo user - Codehaus Bamboo</title>\\n    <meta http-equiv=\\\"X-UA-Compatible\\\" content=\\\"IE=EDGE\\\" />\\n\\n    <meta...\\n\",\"status\":2,\"issued\":1391976609,\"handlers\":[\"default\"],\"flapping\":false,\"occurrences\":431,\"client\":\"codehaus04.contegix.mgmt\",\"check\":\"http_bamboo-ci.codehaus.org\"}]", { 'content-type': 'application/json;charset=utf-8',
    'content-length': '376835',
    connection: 'keep-alive',
    server: 'thin 1.5.0 codename Knife' });

nock('http://puppet-db01.contegix.com:8080')
  .filteringPath(/query=[^&]*/g, 'query=[%22and%22,%20[%22=%22,%20%22status%22,%20%22failure%22],%20[%22~%22,%20%22certname%22,%20%22contegix.mgmt$%22],[%22%3E%22,%20%22timestamp%22,%20%222014-02-09T03:48:53-06:00%22]]')
  .get('/v3/events?query=[%22and%22,%20[%22=%22,%20%22status%22,%20%22failure%22],%20[%22~%22,%20%22certname%22,%20%22contegix.mgmt$%22],[%22%3E%22,%20%22timestamp%22,%20%222014-02-09T03:48:53-06:00%22]]')
  .reply(200, "[ ]", { date: 'Sun, 09 Feb 2014 19:48:58 GMT',
    'content-type': 'application/json; charset=utf-8',
    'content-length': '3',
    server: 'Jetty(7.x.y-SNAPSHOT)' });

nock('http://puppet-db01.contegix.com:8080')
  .filteringPath(/query=[^&]*/g, 'query=[%22%3E%22,%20%22timestamp%22,%20%222014-02-09T10:06:04-06:00%22]')
  .get('/v3/aggregate-event-counts?query=[%22%3E%22,%20%22timestamp%22,%20%222014-02-09T10:06:04-06:00%22]&summarize-by=certname')
  .reply(200, "{\n  \"successes\" : 0,\n  \"failures\" : 0,\n  \"noops\" : 0,\n  \"skips\" : 0,\n  \"total\" : 0\n}", { date: 'Sun, 09 Feb 2014 19:48:58 GMT',
    'content-type': 'application/json; charset=utf-8',
    'content-length': '84',
    server: 'Jetty(7.x.y-SNAPSHOT)' });

nock('http://puppet-db01.contegix.com:8080')
  .get('/v3/metrics/mbean/com.puppetlabs.puppetdb.query.population%3Atype%3Ddefault%2Cname%3Dnum-nodes')
  .reply(200, "{\n  \"Value\" : 739\n}", { date: 'Sun, 09 Feb 2014 19:48:58 GMT',
    'content-type': 'application/json; charset=utf-8',
    'content-length': '19',
    server: 'Jetty(7.x.y-SNAPSHOT)' });

nock('http://puppet-db01.contegix.com:8080')
  .get('/v3/metrics/mbean/com.puppetlabs.puppetdb.query.population%3Atype%3Ddefault%2Cname%3Dnum-resources')
  .reply(200, "{\n  \"Value\" : 63276\n}", { date: 'Sun, 09 Feb 2014 19:48:58 GMT',
    'content-type': 'application/json; charset=utf-8',
    'content-length': '21',
    server: 'Jetty(7.x.y-SNAPSHOT)' });

nock('http://puppet-db01.contegix.com:8080')
  .get('/v3/metrics/mbean/com.puppetlabs.puppetdb.query.population%3Atype%3Ddefault%2Cname%3Davg-resources-per-node')
  .reply(200, "{\n  \"Value\" : 85.62381596752368\n}", { date: 'Sun, 09 Feb 2014 19:48:58 GMT',
    'content-type': 'application/json; charset=utf-8',
    'content-length': '33',
    server: 'Jetty(7.x.y-SNAPSHOT)' });

nock('http://puppet-db01.contegix.com:8080')
  .get('/v3/metrics/mbean/com.puppetlabs.puppetdb.query.population%3Atype%3Ddefault%2Cname%3Dpct-resource-dupes')
  .reply(200, "{\n  \"Value\" : 0.6128705986471964\n}", { date: 'Sun, 09 Feb 2014 19:48:58 GMT',
    'content-type': 'application/json; charset=utf-8',
    'content-length': '34',
    server: 'Jetty(7.x.y-SNAPSHOT)' });
