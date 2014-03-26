/*global it:false */
/*global describe:false */
process.env.NODE_ENV = 'test';
process.env.LOG_DIR = './';

var app = {};
app.locals = {};
app.locals.logger = {};
app.locals.logger.log = function (level, message, metadata) {
  "use strict";
};

var config = {};
config.roles = {};
config.roles.users = {};
config.roles.sales = {};
config.roles.support = {};
config.roles.admin = {};
config.roles.super = {};

config.roles.users.groups = ['users'];
config.roles.sales.groups = ['sales'];
config.roles.support.groups = ['engineers'];
config.roles.admin.groups = ['leads'];
config.roles.super.groups = ['devops'];

config.roles.users.users = [];
config.roles.sales.users = [];
config.roles.support.users = [];
config.roles.admin.users = ['oneOffAdmin'];
config.roles.super.users = [];

var roleManager = require('../../src/lib/roleManager')(app, config.roles);

require('supertest');
var assert = require('assert');
require('should');
/*
module.isUsers = isUsers;
module.isSales = isSales;
module.isSupport = isSupport;
module.isAdmin = isAdmin;
module.isSuper = isSuper;
*/

describe("roleManager isUsers", function (){
  "use strict";
  it('should find user test as a user', function () {
    var testUser = {username: 'test', groups: ['users'] };
    var req = {currentUser: testUser};
    assert.equal(true, roleManager.isUsers(req));
  });
  it('should NOT find user fake as a user', function () {
    var fakeUser = {username: 'fake', groups: [] };
    var req = {currentUser: fakeUser};
    assert.equal(false, roleManager.isUsers(req));
  });
  it('should find user engineer in the support role', function () {
    var testUser = {username: 'test', groups: ['engineers'] };
    var req = {currentUser: testUser};
    assert.equal(true, roleManager.isSupport(req));
  });
  it('should NOT find user sales in the support role', function () {
    var fakeUser = {username: 'fake', groups: ['sales'] };
    var req = {currentUser: fakeUser};
    assert.equal(false, roleManager.isSupport(req));
  });
  it('should find user sales in the sales role', function () {
    var testUser = {username: 'test', groups: ['sales'] };
    var req = {currentUser: testUser};
    assert.equal(true, roleManager.isSales(req));
  });
  it('should NOT find user engineer in the sales role', function () {
    var fakeUser = {username: 'fake', groups: ['engineers'] };
    var req = {currentUser: fakeUser};
    assert.equal(false, roleManager.isSales(req));
  });
  it('should find user admin in the admin role', function () {
    var testUser = {username: 'test', groups: ['leads'] };
    var req = {currentUser: testUser};
    assert.equal(true, roleManager.isAdmin(req));
  });
  it('should NOT find user engineer in the admin role', function () {
    var fakeUser = {username: 'fake', groups: ['engineers'] };
    var req = {currentUser: fakeUser};
    assert.equal(false, roleManager.isAdmin(req));
  });
  it('should find user devops in the super role', function () {
    var testUser = {username: 'test', groups: ['devops'] };
    var req = {currentUser: testUser};
    assert.equal(true, roleManager.isSuper(req));
  });
  it('should NOT find user engineers in the super role', function () {
    var fakeUser = {username: 'fake', groups: ['engineers'] };
    var req = {currentUser: fakeUser};
    assert.equal(false, roleManager.isSuper(req));
  });
  it('should find user oneoffAdmin in the admin role', function () {
    var fakeUser = {username: 'oneOffAdmin', groups: ['leads'] };
    var req = {currentUser: fakeUser};
    assert.equal(true, roleManager.isAdmin(req));
  });
  it('should NOT find user oneoffAdmin in the super role', function () {
    var fakeUser = {username: 'oneOffAdmin', groups: ['leads'] };
    var req = {currentUser: fakeUser};
    assert.equal(false, roleManager.isSuper(req));
  });
});
