/*global it:false */
/*global describe:false */
process.env.NODE_ENV = 'test';
process.env.LOG_DIR = './';
var app = require('../../../../src/app');
var request = require('supertest');

// Test Writing reference:
// https://github.com/visionmedia/supertest
// https://github.com/visionmedia/express/tree/master/test

describe('GET /api/v1/helpdesk/devices/deviceid/10020', function(){
  "use strict";
  it('should return code 200', function(done){
    request(app)
      .get('/api/v1/helpdesk/devices/deviceid/10020')
      .expect(200, done);
  });
  it('should respond with json', function(done){
    request(app)
      .get('/api/v1/helpdesk/devices/deviceid/10020')
      .expect('Content-Type', /json/, done);
  });
});

describe('GET /api/v1/helpdesk/devices/deviceid/10020/tickets', function(){
  "use strict";
  it('should return code 200', function(done){
    request(app)
      .get('/api/v1/helpdesk/devices/deviceid/10020/tickets')
      .expect(200, done);
  });
  it('should respond with json', function(done){
    request(app)
      .get('/api/v1/helpdesk/devices/deviceid/10020/tickets')
      .expect('Content-Type', /json/, done);
  });
});

describe('GET /api/v1/helpdesk/devices/hostname', function(){
  "use strict";
  this.timeout(5000);
  it('should return code 200', function(done){
    request(app)
      .get('/api/v1/helpdesk/devices/hostname')
      .expect(200, done);
  });
  it('should respond with json', function(done){
    request(app)
      .get('/api/v1/helpdesk/devices/hostname')
      .expect('Content-Type', /json/, done);
  });
});

describe('GET /api/v1/helpdesk/devices/hostname/jsklskwtrs-engage05.unittest.us', function(){
  "use strict";
  it('should return code 200', function(done) {
    request(app)
      .get('/api/v1/helpdesk/devices/hostname/jsklskwtrs-engage05.unittest.us')
      .expect(200, done);
  });
  it('should respond with json', function(done){
    request(app)
      .get('/api/v1/helpdesk/devices/hostname/jsklskwtrs-engage05.unittest.us')
      .expect('Content-Type', /json/, done);
  });
  it('should return jsklskwtrs-engage05', function(done) {
    request(app)
      .get('/api/v1/helpdesk/devices/hostname/jsklskwtrs-engage05.unittest.us')
      .expect(200, {
        "aaData":[
          {
            "domain":"jaskolski-waters.com",
            "deviceID":10023,
            "typeGroupID":"1",
            "shortname":"jsklskwtrs",
            "ipAddr":"10.50.33.47",
            "typeGroupName":"Servers",
            "clientID":1003,
            "name":"jsklskwtrs-engage05",
            "company":"Jaskolski-Waters",
            "management_level":"managed",
            "device_status":"Active",
            "type":"Servers",
            "dev_desc":"jsklskwtrs-engage05",
            "dev":10023,
            "client_id":1003,
            "clientid":1003,
            "label":"jsklskwtrs-servers",
            "active":1,
            "location":"SJC"
          }
        ]
      }, done);
  });
});
describe('GET /api/v1/helpdesk/clients/clientid/1022', function(){
  "use strict";
  it('should return code 200', function(done){
    request(app)
      .get('/api/v1/helpdesk/clients/clientid/1022')
      .expect(200, done);
  });
  it('should respond with json', function(done){
    request(app)
      .get('/api/v1/helpdesk/clients/clientid/1022')
      .expect('Content-Type', /json/, done);
  });
});

describe('GET /api/v1/helpdesk/devices/devgroupid/1', function(){
  "use strict";
  this.timeout(3500);
  it('should return code 200', function(done){
    request(app)
      .get('/api/v1/helpdesk/devices/devgroupid/1')
      .expect(200, done);
  });
  it('should respond with json', function(done){
    request(app)
      .get('/api/v1/helpdesk/devices/devgroupid/1')
      .expect('Content-Type', /json/, done);
  });
});

describe('GET /api/v1/sensu/events/filtered', function(){
  "use strict";
  it('should return code 200', function(done){
    request(app)
      .get('/api/v1/sensu/events/filtered')
      .expect(200, done);
  });
  it('should respond with json', function(done){
    request(app)
      .get('/api/v1/sensu/events/filtered')
      .expect('Content-Type', /json/, done);
  });
});
