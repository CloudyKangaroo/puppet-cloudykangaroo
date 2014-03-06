process.env.NODE_ENV = 'test';
process.env.LOG_DIR = './';
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

