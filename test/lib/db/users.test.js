/*global it:false */
/*global describe:false */
process.env.NODE_ENV = 'test';
process.env.LOG_DIR = './';

var db = require('../../../src/lib/db')();

require('supertest');
var assert = require('assert');
require('should');

describe("db.users", function (){
  "use strict";
  it('should find user bob', function () {
    var bobUser = db.users.syncfindByUsername('bob');
    bobUser.should.have.property('username');
    bobUser.should.have.property('username');
    bobUser.username.should.equal('bob');
    assert.equal('bob', bobUser.username);
  });

  it('should allow new users', function() {
    db.users.addUser({id: 521, username: 'mocha'}, function(err, mochaUser) {
      mochaUser.should.have.property('username');
      mochaUser.username.should.equal('mocha');
    });
  });

  it('should apply default properties', function () {
    db.users.addUser({id: 521, username: 'mocha'}, function(err, mochaUser) {
      mochaUser.should.have.property('name');
      mochaUser.should.have.property('type');
      mochaUser.should.have.property('emails');
      mochaUser.username.should.equal('mocha');
    });
  });
});
