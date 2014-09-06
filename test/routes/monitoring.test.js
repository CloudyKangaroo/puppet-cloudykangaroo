/* jshint unused: false */
/*global it:false */
/*global describe:false */
process.env.NODE_ENV = 'test';
process.env.LOG_DIR = './';

var app = require('../../src/app');
var request = require('supertest');
var assert = require('assert');
var should = require('should');

// Test Writing reference:
// https://github.com/visionmedia/supertest
// https://github.com/visionmedia/express/tree/master/test

describe('GET /monitoring', function(){
  "use strict";
  this.timeout(2400);
  it('should return code 200', function(done){
    request(app)
      .get('/monitoring')
      .expect(200, done);
  });
  it('should respond with html', function(done) {
    request(app)
      .get('/monitoring')
      .expect('Content-Type', 'text/html; charset=utf-8', done);
  });
});

describe('GET /monitoring/events', function(){
  "use strict";
  it('should return code 200', function(done){
    request(app)
      .get('/monitoring/events')
      .expect(200, done);
  });
  it('should respond with html', function(done) {
    request(app)
      .get('/monitoring/events')
      .expect('Content-Type', 'text/html; charset=utf-8', done);
  });
});

describe('GET /monitoring/events/device/vndrvrt-recontextualize01.unittest.us', function(){
  "use strict";
  it('should return code 200', function(done){
    request(app)
      .get('/monitoring/events/device/vndrvrt-recontextualize01.unittest.us')
      .expect(200, done);
  });
  it('should respond with html', function(done) {
    request(app)
      .get('/monitoring/events/device/vndrvrt-recontextualize01.unittest.us')
      .expect('Content-Type', 'text/html; charset=utf-8', done);
  });
});

describe('GET /monitoring/stashes', function(){
  "use strict";
  it('should return code 200', function(done){
    request(app)
      .get('/monitoring/stashes')
      .expect(200, done);
  });
  it('should respond with html', function(done) {
    request(app)
      .get('/monitoring/stashes')
      .expect('Content-Type', 'text/html; charset=utf-8', done);
  });
});

describe('GET /monitoring/puppet', function(){
  "use strict";
  it('should return code 200', function(done){
    request(app)
      .get('/monitoring/puppet')
      .expect(200, done);
  });
  it('should respond with html', function(done) {
    request(app)
      .get('/monitoring/puppet')
      .expect('Content-Type', 'text/html; charset=utf-8', done);
  });
});

describe('GET /monitoring/clients', function(){
  "use strict";
  this.timeout(3500);
  it('should return code 200', function(done){
    request(app)
      .get('/monitoring/clients')
      .expect(200, done);
  });
  it('should respond with html', function(done) {
    request(app)
      .get('/monitoring/clients')
      .expect('Content-Type', 'text/html; charset=utf-8', done);
  });
});

var isTheCorrectList = function(res) {
  "use strict";
  var clientList = res.body.aaData;
  var client = clientList[0];
  clientList.length.should.equal(5135);
  client.should.have.property('address');
  client.should.have.property('name');
  client.should.have.property('safe_mode');
  client.address.should.equal('10.50.2.63');
};

describe('GET /monitoring/list/clients', function(){
  "use strict";
  this.timeout(2000);
  it('should return code 200', function(done){
    request(app)
      .get('/monitoring/list/clients')
      .expect(200, done);
  });
  it('should respond with json', function(done) {
    request(app)
      .get('/monitoring/list/clients')
      .expect('Content-Type', /json/, done);
  });
  it('should return a list of clients', function (done) {
    request(app)
      .get('/monitoring/list/clients')
      .expect(isTheCorrectList)
      .end(done);
  });
});

describe('GET /monitoring/devices', function(){
  "use strict";
  it('should return code 200', function(done){
    request(app)
      .get('/monitoring/devices')
      .expect(200, done);
  });
  it('should respond with html', function(done) {
    request(app)
      .get('/monitoring/devices')
      .expect('Content-Type', 'text/html; charset=utf-8', done);
  });
});
