/* jshint unused: false */
/*global it:false */
/*global describe:false */
process.env.NODE_ENV = 'test';
process.env.LOG_DIR = './';

var app = require('../../../src/app');
var request = require('supertest');
var assert = require('assert');
var should = require('should');

// Test Writing reference:
// https://github.com/visionmedia/supertest
// https://github.com/visionmedia/express/tree/master/test

describe('GET /helpdesk/clients', function(){
    "use strict";
    this.timeout(2400);
    it('should return code 200', function(done){
        request(app)
            .get('/helpdesk/clients')
            .set('Accept', 'application/json')
            .expect(200, done);
    });
    it('should respond with html', function(done) {
        request(app)
            .get('/helpdesk/clients')
            .expect('Content-Type', 'text/html; charset=utf-8', done);
    });
});

describe('GET /helpdesk/devices/hostname/jsklskwtrs-engage05.unittest.us', function(){
    "use strict";
    this.timeout(2400);
    it('should return code 302 Found', function(done){
        request(app)
            .get('/helpdesk/devices/hostname/jsklskwtrs-engage05.unittest.us')
            .expect(302)
            .end(done);
    });
    it('should respond with text', function(done) {
        request(app)
            .get('/helpdesk/devices/hostname/jsklskwtrs-engage05.unittest.us')
            .expect('Content-Type', 'text/plain; charset=UTF-8', done);
    });
});

describe('GET /helpdesk/devices', function(){
    "use strict";
    this.timeout(2400);
    it('should return code 200', function(done){
        request(app)
            .get('/helpdesk/devices')
            .expect(200, done);
    });
    it('should respond with html', function(done) {
        request(app)
            .get('/helpdesk/devices')
            .expect('Content-Type', 'text/html; charset=utf-8', done);
    });
});