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

var roles = {
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
    users: []
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

var noRolesManager = require('../../src/lib/roleManager')(app, noRoles);

var roleManager = require('../../src/lib/roleManager')(app, roles);

require('supertest');
var assert = require('assert');
require('should');
/*
Need tests for:
handle, is, can, use
*/

describe("roleManager undefined roles", function (){
  "use strict";
  it('should throw an error with no users role', function () {
    assert.throws(
      function () {
        var brokenRoles = {};
        var brokenRoleManager = require('../../src/lib/roleManager')(app, brokenRoles);
        var testUser = {username: 'test', groups: ['users'] };
        var req = {currentUser: testUser};
        brokenRoleManager.isUsers(req);
      },
      function (err) {
        if ( (err instanceof Error) && err.message === 'Required role users is not defined' ) {
          return true;
        }
      },
      "unexpected error"
    );
  });
  it('should find user test as a user with no other roles defined', function () {
    var testUser = {username: 'test', groups: ['users'] };
    var req = {currentUser: testUser};
    assert.equal(true, noRolesManager.isUsers(req));
  });
  it('should NOT find sales as sales when sales was not defined', function () {
    var fakeUser = {username: 'fake', groups: ['sales'] };
    var req = {currentUser: fakeUser};
    assert.equal(false, noRolesManager.isSales(req));
  });
});

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
});

describe("roleManager isHelpdesk", function (){
  "use strict";
  it('should find user engineer in the helpdesk role', function () {
    var testUser = {username: 'test', groups: ['users', 'engineers'] };
    var req = {currentUser: testUser};
    assert.equal(true, roleManager.isHelpdesk(req));
  });
  it('should NOT find user sales in the helpdesk role', function () {
    var fakeUser = {username: 'fake', groups: ['users', 'sales'] };
    var req = {currentUser: fakeUser};
    assert.equal(false, roleManager.isHelpdesk(req));
  });
});

describe("roleManager isMonitoring", function (){
  "use strict";
  it('should find user engineer in the monitoring role', function () {
    var testUser = {username: 'test', groups: ['users', 'engineers'] };
    var req = {currentUser: testUser};
    assert.equal(true, roleManager.isMonitoring(req));
  });
  it('should NOT find user sales in the monitoring role', function () {
    var fakeUser = {username: 'fake', groups: ['users', 'sales'] };
    var req = {currentUser: fakeUser};
    assert.equal(false, roleManager.isMonitoring(req));
  });
});

describe("roleManager isSales", function (){
  "use strict";
  it('should find user sales in the sales role', function () {
    var testUser = {username: 'test', groups: ['users', 'sales'] };
    var req = {currentUser: testUser};
    assert.equal(true, roleManager.isSales(req));
  });
  it('should NOT find user engineer in the sales role', function () {
    var fakeUser = {username: 'fake', groups: ['users', 'engineers'] };
    var req = {currentUser: fakeUser};
    assert.equal(false, roleManager.isSales(req));
  });
});

describe("roleManager isAdmin", function (){
  "use strict";
  it('should find user admin in the admin role', function () {
    var testUser = {username: 'test', groups: ['users', 'leads'] };
    var req = {currentUser: testUser};
    assert.equal(true, roleManager.isAdmin(req));
  });
  it('should NOT find user engineer in the admin role', function () {
    var fakeUser = {username: 'fake', groups: ['users', 'engineers'] };
    var req = {currentUser: fakeUser};
    assert.equal(false, roleManager.isAdmin(req));
  });
});

describe("roleManager isSuper", function (){
  "use strict";
  it('should find user devops in the super role', function () {
    var testUser = {username: 'test', groups: ['users', 'devops'] };
    var req = {currentUser: testUser};
    assert.equal(true, roleManager.isSuper(req));
  });
  it('should NOT find user engineers in the super role', function () {
    var fakeUser = {username: 'fake', groups: ['users', 'engineers'] };
    var req = {currentUser: fakeUser};
    assert.equal(false, roleManager.isSuper(req));
  });
});

describe("roleManager one off users", function (){
  "use strict";
  it('should find user oneoffAdmin in the admin role', function () {
    var fakeUser = {username: 'oneOffAdmin', groups: ['users', 'leads'] };
    var req = {currentUser: fakeUser};
    assert.equal(true, roleManager.isAdmin(req));
  });
  it('should NOT find user oneoffAdmin in the super role', function () {
    var fakeUser = {username: 'oneOffAdmin', groups: ['users', 'leads'] };
    var req = {currentUser: fakeUser};
    assert.equal(false, roleManager.isSuper(req));
  });
});