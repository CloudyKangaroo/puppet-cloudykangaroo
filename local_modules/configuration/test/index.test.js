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

describe('GET /admin/configuration', function(){
    "use strict";
    this.timeout(2400);
    it('should return code 200', function(done){
        request(app)
            .get('/admin/configuration')
            .set('Accept', 'application/json')
            .expect(200, done);
    });
    it('should respond with html', function(done) {
        request(app)
            .get('/admin/configuration')
            .expect('Content-Type', 'text/html; charset=utf-8', done);
    });
});

describe('GET /admin/configuration/wizard', function(){
    "use strict";
    this.timeout(2400);
    it('should return code 200', function(done){
        request(app)
            .get('/admin/configuration')
            .set('Accept', 'application/json')
            .expect(200, done);
    });
    it('should respond with html', function(done) {
        request(app)
            .get('/admin/configuration/wizard')
            .expect('Content-Type', 'text/html; charset=utf-8', done);
    });
});

describe('GET /api/v1/admin/configuration', function(){
    "use strict";
    it('should return code 200', function(done){
        request(app)
            .get('/api/v1/admin/configuration')
            .expect(200, done);
    });
    it('should respond with json', function(done){
        request(app)
            .get('/api/v1/admin/configuration')
            .expect('Content-Type', /json/, done);
    });
});