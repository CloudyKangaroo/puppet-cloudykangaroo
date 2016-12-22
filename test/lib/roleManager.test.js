/*global it:false */
/*global describe:false */
process.env.NODE_ENV = 'test';
process.env.LOG_DIR = './';

var app = {};
app.base_config_dir =  __dirname + '/config';

app.locals = {};
app.locals.logger = {};
app.locals.logger.log = function () {
  "use strict";
};

app.locals.roles = {
  users: {
    name: 'users',
    description: 'Minimum access, required to login',
    groups: ['users'],
    users: []
  },
  sales: {
    name: 'sales',
    description: 'Provides access to lead and account management functionality. Also provides read-only access to monitoring.',
    groups: ['sales'],
    users: []
  },
  helpdesk: {
    name: 'helpdesk',
    description: 'Provides access to helpdesk functionality. Also provides read-only access to monitoring.',
    groups: ['engineers'],
    users: []
  },
  monitoring: {
    name: 'monitoring',
    description: 'Provides additional access to monitoring systems.',
    groups: ['engineers'],
    users: []
  },
  admin: {
    name: 'admin',
    description: 'Provides full access to sales, monitoring and helpdesk functionality.',
    groups: ['leads'],
    users: ['oneOffAdmin']
  },
  super: {
    name: 'super',
    description: 'Provides access to administrative functions.',
    groups: ['devops'],
    users: []
  }
};

var noRoles = {
  users: {
    name: 'users',
    description: 'Minimum access, required to login',
    groups: ['users'],
    users: []
  }
};

var assert = require('assert');

/*
Need tests for:
handle, is, can, use
*/
/*
describe("roleManager undefined roles", function (){
  "use strict";
  it('should throw an error with no users role', function () {
    assert.throws(
      function () {
        var brokenRoles = {};
        var brokenRolesApp = app;
        brokenRolesApp.locals.roles = brokenRoles;
        var brokenRoleManager = require('../../src/lib/roleManager')(brokenRolesApp);
        var testUser = {username: 'test', groups: ['users'] };
        var req = {currentUser: testUser};
        brokenRoleManager.isUsers(req);
      },
      function (err) {
        return ( (err instanceof Error) && err.message === 'Required role users is not defined' );
      },
      "unexpected error"
    );
  });
  it('should find user test as a user with no other roles defined', function () {
    var testUser = {username: 'test', groups: ['users'] };
    var req = {currentUser: testUser};
    var noRolesApp = app;
    noRolesApp.locals.roles = noRoles;
    var noRolesManager = require('../../src/lib/roleManager')(noRolesApp);
    assert.equal(true, noRolesManager.isUsers(req));
  });
  it('should NOT find sales as sales when sales was not defined', function () {
    var fakeUser = {username: 'fake', groups: ['sales'] };
    var req = {currentUser: fakeUser};
    var noRolesApp = app;
    noRolesApp.locals.roles = noRoles;
    var noRolesManager = require('../../src/lib/roleManager')(noRolesApp);
    assert.equal(false, noRolesManager.isSales(req));
  });
});
*/

describe ("roleManager registerRole", function () {
  "use string";
  var name = 'role';
  var groups = ['groups'];
  var users = ['users'];
  var description = 'description';

  it('should throw error with empty name', function () {
    var roleManager = require('../../src/lib/roleManager')(app);
    assert.deepEqual(roleManager.registerRole(''),new Error('name is a required field for registerRole()'));
  });
  it('should throw error with no name', function () {
    var roleManager = require('../../src/lib/roleManager')(app);
    assert.deepEqual(roleManager.registerRole(),new Error('name is a required field for registerRole()'));
  });
  it('should provide default description', function () {
    var roleManager = require('../../src/lib/roleManager')(app);
    var expectedRole = { name: name, description: 'no description provided', groups: [], users: []};
    var newRole = roleManager.registerRole(name);
    assert.deepEqual(newRole.description, expectedRole.description);
  });
  it('should provide empty groups', function () {
    var roleManager = require('../../src/lib/roleManager')(app);
    var expectedRole = { name: name, description: description, groups: [], users: []};
    var newRole = roleManager.registerRole(name, description, '');
    assert.deepEqual(newRole.groups, expectedRole.groups);
  });
  it('should provide empty users', function () {
    var roleManager = require('../../src/lib/roleManager')(app);
    var expectedRole = { name: name, description: description, groups: [], users: []};
    var newRole = roleManager.registerRole(name, description);
    assert.deepEqual(newRole.users, expectedRole.users);
  });
  it('should populate groups', function () {
    var roleManager = require('../../src/lib/roleManager')(app);
    var expectedRole = { name: name, description: description, groups: groups, users: []};
    var newRole = roleManager.registerRole(name, description, groups);
    assert.deepEqual(newRole.groups, expectedRole.groups);
  });
  it('should populate users', function () {
    var roleManager = require('../../src/lib/roleManager')(app);
    var expectedRole = { name: name, description: description, groups: [], users: users};
    var newRole = roleManager.registerRole(name, description, [], users);
    assert.deepEqual(newRole.users, expectedRole.users);
  });
});

describe("roleManager authorizeUserRoles", function (){
  "use strict";
  it('should find admin in the admin role', function () {
    var fakeUser = {username: 'admin', groups: ['users', 'leads'] };
    var roleManager = require('../../src/lib/roleManager')(app);
    assert.equal(true, roleManager.authorizeUserRoles(fakeUser, ['admin'], 'AND'));
  });
  it('should find admin in the admin OR sales role', function () {
    var fakeUser = {username: 'admin', groups: ['users', 'leads'] };
    var roleManager = require('../../src/lib/roleManager')(app);
    assert.equal(true, roleManager.authorizeUserRoles(fakeUser, ['admin', 'sales'], 'OR'));
  });
  it('should NOT find admin in the helpdesk OR sales role', function () {
    var fakeUser = {username: 'admin', groups: ['users', 'leads'] };
    var roleManager = require('../../src/lib/roleManager')(app);
    assert.equal(false, roleManager.authorizeUserRoles(fakeUser, ['helpdesk', 'sales'], 'OR'));
  });
  it('should NOT find admin in the admin AND sales role', function () {
    var fakeUser = {username: 'admin', groups: ['users', 'leads'] };
    var roleManager = require('../../src/lib/roleManager')(app);
    assert.equal(false, roleManager.authorizeUserRoles(fakeUser, ['admin', 'sales'], 'AND'));
  });
  it('should NOT find se in the admin AND sales role', function () {
    var fakeUser = {username: 'se', groups: ['users', 'engineers', 'sales'] };
    var roleManager = require('../../src/lib/roleManager')(app);
    assert.equal(false, roleManager.authorizeUserRoles(fakeUser, ['admin', 'sales'], 'AND'));
  });
  it('should find sales-engineer in the helpdesk AND sales role', function () {
    var fakeUser = {username: 'se', groups: ['users', 'engineers', 'sales'] };
    var roleManager = require('../../src/lib/roleManager')(app);
    assert.equal(true, roleManager.authorizeUserRoles(fakeUser, ['helpdesk', 'sales'], 'AND'));
  });
});

describe("roleManager hasRequiredRoles", function (){
  "use strict";
  it('should find admin in the admin role', function () {
    var fakeUser = {username: 'admin', groups: ['users', 'leads'] };
    var roleManager = require('../../src/lib/roleManager')(app);
    assert.equal(true, roleManager.hasRequiredRoles(fakeUser, ['admin'], 'AND'));
  });
  it('should allow null user as a guest', function () {
    var fakeUser = null;
    var roleManager = require('../../src/lib/roleManager')(app);
    assert.equal(true, roleManager.hasRequiredRoles(fakeUser, ['guest']));
  });
  it('should NOT allow null for other roles', function () {
    var fakeUser = null;
    var roleManager = require('../../src/lib/roleManager')(app);
    assert.equal(false, roleManager.hasRequiredRoles(fakeUser, ['admin']));
  });
  it('should handle undefined roles gracefully and not grant access', function () {
    var fakeUser = {username: 'admin', groups: ['users', 'leads'] };
    var roleManager = require('../../src/lib/roleManager')(app);
    assert.equal(false, roleManager.hasRequiredRoles(fakeUser, ['admininistrator']));
  });
  it('should find admin in the admin OR sales role', function () {
    var fakeUser = {username: 'admin', groups: ['users', 'leads'] };
    var roleManager = require('../../src/lib/roleManager')(app);
    assert.equal(true, roleManager.hasRequiredRoles(fakeUser, ['admin', 'sales'], 'OR'));
  });
  it('should NOT find admin in the admin AND sales role', function () {
    var fakeUser = {username: 'admin', groups: ['users', 'leads'] };
    var roleManager = require('../../src/lib/roleManager')(app);
    assert.equal(false, roleManager.hasRequiredRoles(fakeUser, ['admin', 'sales'], 'AND'));
  });
  it('should NOT find se in the admin AND sales role', function () {
    var fakeUser = {username: 'se', groups: ['users', 'engineers', 'sales'] };
    var roleManager = require('../../src/lib/roleManager')(app);
    assert.equal(false, roleManager.hasRequiredRoles(fakeUser, ['admin', 'sales'], 'AND'));
  });
  it('should find sales-engineer in the helpdesk AND sales role', function () {
    var fakeUser = {username: 'se', groups: ['users', 'engineers', 'sales'] };
    var roleManager = require('../../src/lib/roleManager')(app);
    assert.equal(true, roleManager.hasRequiredRoles(fakeUser, ['helpdesk', 'sales'], 'AND'));
  });
  it('should throw error on invalid JOIN', function () {
    assert.throws(
      function () {
        var fakeUser = {username: 'se', groups: ['users', 'engineers', 'sales'] };
        var roleManager = require('../../src/lib/roleManager')(app);
        roleManager.hasRequiredRoles(fakeUser, ['users'], 'NOR');
      },
      function (err) {
        return  ( (err instanceof Error) && err.message === 'Invalid Join type NOR' );
      },
      "unexpected error"
    );
  });
  it('should default to required role users', function () {
    var fakeUser = {username: 'se', groups: ['users', 'engineers', 'sales'] };
    var roleManager = require('../../src/lib/roleManager')(app);
    assert.equal(true, roleManager.hasRequiredRoles(fakeUser));
  });
});


describe("roleManager middleware", function (){
  "use strict";
  it('should add roles property to currentUser', function () {
    var fakeUser = {username: 'admin', groups: ['users', 'leads'] };
    var req = {headers: { accept: 'application/json'}, currentUser: fakeUser};
    var res = {};
    var roleManager = require('../../src/lib/roleManager')(app);
    roleManager.handle(req, res, function() {
      var _ = require('underscore');
      assert.equal(2, _.intersection(req.currentUser.roles, ['users', 'admin']).length);
    });
  });
  it('should add no roles to unauthenticated user', function () {
    var req = {headers: { accept: 'application/json'}};
    var res = {};
    var roleManager = require('../../src/lib/roleManager')(app);
    roleManager.handle(req, res, function() {
      assert.equal(false, req.hasOwnProperty('currentUser'));
    });
  });
});

describe("roleManager authFailureHandler", function (){
  "use strict";
  it('should send 403 to API clients', function () {
    var fakeUser = {username: 'admin', groups: ['users', 'leads'] };
    var req = {headers: { accept: 'application/json'}, currentUser: fakeUser};
    var res = {};
    res.send = function(code) {
      assert.equal(403, code);
    };
    var roleManager = require('../../src/lib/roleManager')(app);
    roleManager.authFailureHandler(req, res, 'test all the things');
  });

  it('should send 403 to API clients when no user authenticated', function () {
    var req = {headers: { accept: 'application/json'}};
    var res = {};
    res.send = function(code) {
      assert.equal(403, code);
    };
    var roleManager = require('../../src/lib/roleManager')(app);
    roleManager.authFailureHandler(req, res, 'test all the things');
  });
  it('supply a returnto parameter', function () {
    var fakeUser = {username: 'admin', groups: ['users', 'leads'] };
    var req = {headers: { accept: 'text/html'}, currentUser: fakeUser, session: {}, url: '/auth/failure/test'};
    req.flash = function(text) {
      assert.equal('error', text);
    };
    var res = {};
    res.redirect = function(path) {
      assert.equal('/account/login', path);
    };
    var roleManager = require('../../src/lib/roleManager')(app);
    roleManager.authFailureHandler(req, res, 'test all the things');
    assert.equal('/auth/failure/test', req.session.returnTo);
  });
  it('should redirect to the login page for HTML clients', function () {
    var fakeUser = {username: 'admin', groups: ['users', 'leads'] };
    var req = {headers: { accept: 'text/html'}, currentUser: fakeUser, session: {}, url: '/auth/failure/test'};
    req.flash = function(text) {
      assert.equal('error', text);
    };
    var res = {};
    res.redirect = function(path) {
      assert.equal('/account/login', path);
    };
    var roleManager = require('../../src/lib/roleManager')(app);
    roleManager.authFailureHandler(req, res, 'test all the things');
  });
});