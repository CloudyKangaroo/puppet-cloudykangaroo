process.env.NODE_ENV = 'test';
process.env.LOG_DIR = './';
var app = require('../app');
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

describe('GET /api/v1/ubersmith/devices/deviceid/10020', function(){
  it('should return code 200', function(done){
    request(app)
      .get('/api/v1/ubersmith/devices/deviceid/10020')
      .expect(200, done);
  });
  it('should respond with json', function(done){
    request(app)
      .get('/api/v1/ubersmith/devices/deviceid/10020')
      .expect('Content-Type', /json/, done);
  });
});

describe('GET /api/v1/ubersmith/devices/deviceid/10020/tickets', function(){
  it('should return code 200', function(done){
    request(app)
      .get('/api/v1/ubersmith/devices/deviceid/10020/tickets')
      .expect(200, done);
  });
  it('should respond with json', function(done){
    request(app)
      .get('/api/v1/ubersmith/devices/deviceid/10020/tickets')
      .expect('Content-Type', /json/, done);
  });
});

describe('GET /api/v1/ubersmith/devices/hostname', function(){
  it('should return code 200', function(done){
    request(app)
      .get('/api/v1/ubersmith/devices/hostname')
      .expect(200, done);
  });
  it('should respond with json', function(done){
    request(app)
      .get('/api/v1/ubersmith/devices/hostname')
      .expect('Content-Type', /json/, done);
  });
});

describe('GET /api/v1/ubersmith/devices/hostname/jsklskwtrs-engage05.unittest.us', function(){
  it('should return code 200', function(done) {
    request(app)
      .get('/api/v1/ubersmith/devices/hostname/jsklskwtrs-engage05.unittest.us')
      .expect(200, done);
  });
  it('should respond with json', function(done){
    request(app)
      .get('/api/v1/ubersmith/devices/hostname/jsklskwtrs-engage05.unittest.us')
      .expect('Content-Type', /json/, done);
  });
  it('should return jsklskwtrs-engage05', function(done) {
    request(app)
      .get('/api/v1/ubersmith/devices/hostname/jsklskwtrs-engage05.unittest.us')
      .expect(200, {"aaData":[{"domain":"jaskolski-waters.com","deviceID":10023,"typeGroupID":"1","shortname":"jsklskwtrs","ipAddr":"10.50.33.47","typeGroupName":"Servers","clientID":1003,"name":"jsklskwtrs-engage05","company":"Jaskolski-Waters","management_level":"managed","device_status":"Active","type":"Servers","dev_desc":"jsklskwtrs-engage05","dev":10023,"client_id":1003,"clientid":1003,"label":"jsklskwtrs-servers","active":1,"location":"SJC"}]}, done)
  });
});

describe('GET /api/v1/ubersmith/clients/clientid/1022', function(){
  it('should return code 200', function(done){
    request(app)
      .get('/api/v1/ubersmith/clients/clientid/1022')
      .expect(200, done);
  });
  it('should respond with json', function(done){
    request(app)
      .get('/api/v1/ubersmith/clients/clientid/1022')
      .expect('Content-Type', /json/, done);
  });
})

describe('GET /api/v1/ubersmith/devices/devgroupid/1', function(){
  it('should return code 200', function(done){
    request(app)
      .get('/api/v1/ubersmith/devices/devgroupid/1')
      .expect(200, done);
  });
  it('should respond with json', function(done){
    request(app)
      .get('/api/v1/ubersmith/devices/devgroupid/1')
      .expect('Content-Type', /json/, done);
  });
});

/*
app.get('/tickets/deviceid/:deviceid', function (req, res, next) {
app.get('/tickets/clientid/:clientid', function (req, res, next) {
app.get('/tickets/ticketid/:ticketid/posts', function (req, res, next) {
app.get('/tickets/ticketid/:ticketid', function (req, res, next) {
app.get('/tickets', function (req, res, next) {
app.get('/clients', function (req, res, next) {
app.get('/clients/clientid/:clientid', function (req, res, next) {
app.get('/clients/clientid/:clientid/tickets', function (req, res, next) {
app.get('/clients/clientid/:clientid/contacts', function (req, res, next) {
app.get('/contacts/contactid/:contactid', function (req, res, next) {
app.get('/admins', function (req, res, next) {
app.get('/'
*/
