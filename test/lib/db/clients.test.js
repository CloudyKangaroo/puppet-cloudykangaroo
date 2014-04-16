/*global it:false */
/*global describe:false */
process.env.NODE_ENV = 'test';
process.env.LOG_DIR = './';

var db = require('../../../src/lib/db')();

require('supertest');
//var assert = require('assert');
require('should');

describe("db.clients", function (){
  it('should find client by ClientID', function () {
    db.clients.findByClientID('325', function(err, client) {
      err.should.not.exist;
    });
  });
  it('should find client by id', function () {
    db.clients.find('325', function(err, client) {
      err.should.not.exist;
    });
  });
});
