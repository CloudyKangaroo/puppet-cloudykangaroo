/* jshint unused: false */
module.exports = function(config, logger) {
  "use strict";

  var nock = require('nock');

  nock.recorder.rec({
    dont_print: true
  });

  var options = {allowUnmocked: true};

  nock('http://sensu-server01.contegix.com:4567', options)
    .get('/info')
    .reply(200, "{\"sensu\":{\"version\":\"0.12.1\"},\"rabbitmq\":{\"keepalives\":{\"messages\":0,\"consumers\":2},\"results\":{\"messages\":0,\"consumers\":2},\"connected\":true},\"redis\":{\"connected\":true}}", { 'content-type': 'application/json;charset=utf-8',
      'content-length': '168',
      connection: 'keep-alive',
      server: 'thin 1.5.0 codename Knife' });

  nock('http://sensu-server01.contegix.com:4567', options)
    .get('/stashes')
    .reply(200, "[{\"path\":\"silence/thomasarts01a.contegix.mgmt/disk\",\"content\":{\"timestamp\":1394450361,\"user\":\"alex.beal\",\"ticketID\":\"none\"},\"expire\":119965},{\"path\":\"silence/sefasinnovation02a.contegix.mgmt/keepalive\",\"content\":{\"timestamp\":1394440947,\"user\":\"ezra.stevens\",\"ticketID\":\"none\"},\"expire\":110551},{\"path\":\"silence/hop02.contegix.mgmt/ping_axis02.contegix.mgmt\",\"content\":{\"timestamp\":1394486526,\"user\":\"richard.chatterton\",\"ticketID\":\"none\"},\"expire\":69730},{\"path\":\"silence/campussnacks01.contegix.mgmt/disk\",\"content\":{\"timestamp\":1394450713,\"user\":\"alex.beal\",\"ticketID\":\"none\"},\"expire\":33917},{\"path\":\"silence/hq01.contegix.mgmt/tcp_openiam01.managed.contegix.com_443\",\"content\":{\"timestamp\":1394449620,\"user\":\"ezra.stevens\",\"ticketID\":\"none\"},\"expire\":104824},{\"path\":\"silence/axis02.contegix.mgmt\",\"content\":{\"timestamp\":1394486532,\"user\":\"richard.chatterton\",\"ticketID\":\"none\"},\"expire\":69736},{\"path\":\"silence/zod.contegix.mgmt/dell_memory\",\"content\":{\"timestamp\":1393551244},\"expire\":-1},{\"path\":\"silence/hop02.contegix.mgmt/ping_openiam01.contegix.mgmt\",\"content\":{\"timestamp\":1394449655,\"user\":\"ezra.stevens\",\"ticketID\":\"none\"},\"expire\":104859},{\"path\":\"silence/hq01.contegix.mgmt/tcp_openiam01.managed.contegix.com_110\",\"content\":{\"timestamp\":1394449635,\"user\":\"ezra.stevens\",\"ticketID\":\"none\"},\"expire\":104839},{\"path\":\"silence/hct-dove.contegix.mgmt/disk\",\"content\":{\"timestamp\":1394450989,\"user\":\"alex.beal\",\"ticketID\":\"none\"},\"expire\":120593},{\"path\":\"silence/solarbridge01.contegix.mgmt/java_heap_wiki.solarbridgetech.com\",\"content\":{\"timestamp\":1394569751,\"user\":\"richard.chatterton\",\"ticketID\":\"none\"},\"expire\":8955},{\"path\":\"silence/hct-hawk.contegix.mgmt/disk\",\"content\":{\"timestamp\":1394451004,\"user\":\"alex.beal\",\"ticketID\":\"none\"},\"expire\":120608},{\"path\":\"silence/hq01.contegix.mgmt/ping_openiam01.managed.contegix.com\",\"content\":{\"timestamp\":1394449612,\"user\":\"ezra.stevens\",\"ticketID\":\"none\"},\"expire\":104816},{\"path\":\"silence/hq01.contegix.mgmt/dell_memory\",\"content\":{\"timestamp\":1393868552},\"expire\":-1},{\"path\":\"silence/hq01.contegix.mgmt/tcp_openiam01.managed.contegix.com_25\",\"content\":{\"timestamp\":1394449625,\"user\":\"ezra.stevens\",\"ticketID\":\"none\"},\"expire\":104829},{\"path\":\"silence/hq01.contegix.mgmt/ping_axis02.managed.contegix.com\",\"content\":{\"timestamp\":1394486518,\"user\":\"richard.chatterton\",\"ticketID\":\"none\"},\"expire\":69722},{\"path\":\"silence/bmc-qa01.contegix.mgmt/disk\",\"content\":{\"timestamp\":1394450642,\"user\":\"alex.beal\",\"ticketID\":\"none\"},\"expire\":33846},{\"path\":\"silence/hq01.contegix.mgmt/tcp_openiam01.managed.contegix.com_80\",\"content\":{\"timestamp\":1394449640,\"user\":\"ezra.stevens\",\"ticketID\":\"none\"},\"expire\":104844}]", { 'content-type': 'application/json;charset=utf-8',
      'content-length': '2666',
      connection: 'keep-alive',
      server: 'thin 1.5.0 codename Knife' });

  var events = "[[{\"output\":\"CheckCPU TOTAL WARNING: total=98.98 user=80.1 nice=2.04 system=8.67 idle=1.02 iowait=1.02 irq=1.02 softirq=6.12 steal=0.0\\n\",\"status\":1,\"issued\":1394589555,\"handlers\":[\"default\"],\"flapping\":false,\"occurrences\":13,\"client\":\"vndrvrt-recontextualize01.unittest.us\",\"check\":\"cpu\"}]";
  nock('http://sensu-server01.contegix.com:4567', options)
    .get('/events/vndrvrt-recontextualize01.unittest.us')
    .reply(200, events, { 'content-type': 'application/json;charset=utf-8',
      'content-length': events.length,
      connection: 'keep-alive',
      server: 'thin 1.5.0 codename Knife' });

  module.play = nock.recorder.play();
  return module;
};