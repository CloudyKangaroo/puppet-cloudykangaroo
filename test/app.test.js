process.env.NODE_ENV = 'test';
process.env.LOG_DIR = './';
process.env.REDIS_CLASS="fakeredis"
process.env.CREDS_CLASS="./config/system-dev-credentials"
process.env.MGMT_DOMAIN=".unittest.us"
process.env.MON_CLASS="./lib/mockMonitoring"
process.env.CRM_CLASS="cloudy-localsmith"
process.env.USE_NOCK=true
//process.env.PORT=3001

var app = require('../src/app');
var request = require('supertest');
var assert = require('assert');
var port = 3333;

// Test Writing reference:
// https://github.com/visionmedia/supertest
// https://github.com/visionmedia/express/tree/master/test

describe('GET /', function(){
  it('should return code 302', function(done){
    request(app)
      .get('/')
      .expect(302, done);
  });
});

