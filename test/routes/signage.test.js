process.env.NODE_ENV = 'test';
process.env.LOG_DIR = './';

var app = require('../../src/app');
var request = require('supertest');
var assert = require('assert');

// Test Writing reference:
// https://github.com/visionmedia/supertest
// https://github.com/visionmedia/express/tree/master/test

describe('GET /signage', function(){
  it('should return code 200', function(done){
    request(app)
      .get('/tickets')
      .expect(200, done);
  });
  it('should respond with html', function(done) {
     request(app)
       .get('/tickets')
       .expect('Content-Type', 'text/html; charset=utf-8', done);
  });
});
