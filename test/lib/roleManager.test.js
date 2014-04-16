/*global it:false */
/*global describe:false */
process.env.NODE_ENV = 'test';
process.env.LOG_DIR = './';

var app = {};
app.locals = {};
app.locals.logger = {};
app.locals.logger.log = function () {
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
    users: ['oneOffAdmin']
  },
  super: {
    name: 'super',
    description: 'Provi' +
      'des access to administrative functions.',
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
        return ( (err instanceof Error) && err.message === 'Required role users is not defined' );
      },
      "unexpected error"
    );
  });
  it('should find user test as a user with no other roles defined', function () {
    var testUser = {username: 'test', groups: ['users'] };
    var req = {currentUser: testUser};
    var noRolesManager = require('../../src/lib/roleManager')(app, noRoles);
    assert.equal(true, noRolesManager.isUsers(req));
  });
  it('should NOT find sales as sales when sales was not defined', function () {
    var fakeUser = {username: 'fake', groups: ['sales'] };
    var req = {currentUser: fakeUser};
    var noRolesManager = require('../../src/lib/roleManager')(app, noRoles);
    assert.equal(false, noRolesManager.isSales(req));
  });
});

describe("roleManager isGuest", function (){
  "use strict";
  it('should find null user as a guest', function () {
    var req = {};
    var roleManager = require('../../src/lib/roleManager')(app, roles);
    assert.equal(true, roleManager.isGuest(req));
  });
  it('should NOT find user fake as a user', function () {
    var fakeUser = {username: 'fake', groups: [] };
    var req = {currentUser: fakeUser};
    var roleManager = require('../../src/lib/roleManager')(app, roles);
    assert.equal(false, roleManager.isGuest(req));
  });
});

describe("roleManager isUsers", function (){
  "use strict";
  it('should find user test as a user', function () {
    var testUser = {username: 'test', groups: ['users'] };
    var req = {currentUser: testUser};
    var roleManager = require('../../src/lib/roleManager')(app, roles);
    assert.equal(true, roleManager.isUsers(req));
  });
  it('should NOT find user fake as a user', function () {
    var fakeUser = {username: 'fake', groups: [] };
    var req = {currentUser: fakeUser};
    var roleManager = require('../../src/lib/roleManager')(app, roles);
    assert.equal(false, roleManager.isUsers(req));
  });
});

describe("roleManager isHelpdesk", function (){
  "use strict";
  it('should find user engineer in the helpdesk role', function () {
    var testUser = {username: 'test', groups: ['users', 'engineers'] };
    var req = {currentUser: testUser};
    var roleManager = require('../../src/lib/roleManager')(app, roles);
    assert.equal(true, roleManager.isHelpdesk(req));
  });
  it('should NOT find user sales in the helpdesk role', function () {
    var fakeUser = {username: 'fake', groups: ['users', 'sales'] };
    var req = {currentUser: fakeUser};
    var roleManager = require('../../src/lib/roleManager')(app, roles);
    assert.equal(false, roleManager.isHelpdesk(req));
  });
});

describe("roleManager isMonitoring", function (){
  "use strict";
  it('should find user engineer in the monitoring role', function () {
    var testUser = {username: 'test', groups: ['users', 'engineers'] };
    var req = {currentUser: testUser};
    var roleManager = require('../../src/lib/roleManager')(app, roles);
    assert.equal(true, roleManager.isMonitoring(req));
  });
  it('should NOT find user sales in the monitoring role', function () {
    var fakeUser = {username: 'fake', groups: ['users', 'sales'] };
    var req = {currentUser: fakeUser};
    var roleManager = require('../../src/lib/roleManager')(app, roles);
    assert.equal(false, roleManager.isMonitoring(req));
  });
});

describe("roleManager isSales", function (){
  "use strict";
  it('should find user sales in the sales role', function () {
    var testUser = {username: 'test', groups: ['users', 'sales'] };
    var req = {currentUser: testUser};
    var roleManager = require('../../src/lib/roleManager')(app, roles);
    assert.equal(true, roleManager.isSales(req));
  });
  it('should NOT find user engineer in the sales role', function () {
    var fakeUser = {username: 'fake', groups: ['users', 'engineers'] };
    var req = {currentUser: fakeUser};
    var roleManager = require('../../src/lib/roleManager')(app, roles);
    assert.equal(false, roleManager.isSales(req));
  });
});

describe("roleManager isAdmin", function (){
  "use strict";
  it('should find user admin in the admin role', function () {
    var testUser = {username: 'test', groups: ['users', 'leads'] };
    var req = {currentUser: testUser};
    var roleManager = require('../../src/lib/roleManager')(app, roles);
    assert.equal(true, roleManager.isAdmin(req));
  });
  it('should NOT find user engineer in the admin role', function () {
    var fakeUser = {username: 'fake', groups: ['users', 'engineers'] };
    var req = {currentUser: fakeUser};
    var roleManager = require('../../src/lib/roleManager')(app, roles);
    assert.equal(false, roleManager.isAdmin(req));
  });
});

describe("roleManager hasAccess", function (){
  "use strict";
  it('should find user admin in the admin role', function () {
    var testUser = {username: 'test', groups: ['users', 'leads'] };
    var req = {currentUser: testUser};
    var roleManager = require('../../src/lib/roleManager')(app, roles);
    assert.equal(true, roleManager.isAdmin(req));
  });
  it('should NOT find user engineer in the admin role', function () {
    var fakeUser = {username: 'fake', groups: ['users', 'engineers'] };
    var req = {currentUser: fakeUser};
    var roleManager = require('../../src/lib/roleManager')(app, roles);
    assert.equal(false, roleManager.isAdmin(req));
  });
});

describe("roleManager isSuper", function (){
  "use strict";
  it('should find user devops in the super role', function () {
    var testUser = {username: 'test', groups: ['users', 'devops'] };
    var req = {currentUser: testUser};
    var roleManager = require('../../src/lib/roleManager')(app, roles);
    assert.equal(true, roleManager.isSuper(req));
  });
  it('should NOT find user engineers in the super role', function () {
    var fakeUser = {username: 'fake', groups: ['users', 'engineers'] };
    var req = {currentUser: fakeUser};
    var roleManager = require('../../src/lib/roleManager')(app, roles);
    assert.equal(false, roleManager.isSuper(req));
  });
});

describe("roleManager one off users", function (){
  "use strict";
  it('should find user oneoffAdmin in the admin role', function () {
    var fakeUser = {username: 'oneOffAdmin', groups: ['users', 'sales'] };
    var req = {currentUser: fakeUser};
    var roleManager = require('../../src/lib/roleManager')(app, roles);
    assert.equal(true, roleManager.isAdmin(req));
  });
  it('should NOT find user oneoffAdmin in the super role', function () {
    var fakeUser = {username: 'oneOffAdmin', groups: ['users', 'sales'] };
    var req = {currentUser: fakeUser};
    var roleManager = require('../../src/lib/roleManager')(app, roles);
    assert.equal(false, roleManager.isSuper(req));
  });
});

describe("roleManager authorizeUserRoles", function (){
  "use strict";
  it('should find admin in the admin role', function () {
    var fakeUser = {username: 'admin', groups: ['users', 'leads'] };
    var roleManager = require('../../src/lib/roleManager')(app, roles);
    assert.equal(true, roleManager.authorizeUserRoles(fakeUser, ['admin'], 'AND'));
  });
  it('should find admin in the admin OR sales role', function () {
    var fakeUser = {username: 'admin', groups: ['users', 'leads'] };
    var roleManager = require('../../src/lib/roleManager')(app, roles);
    assert.equal(true, roleManager.authorizeUserRoles(fakeUser, ['admin', 'sales'], 'OR'));
  });
  it('should NOT find admin in the helpdesk OR sales role', function () {
    var fakeUser = {username: 'admin', groups: ['users', 'leads'] };
    var roleManager = require('../../src/lib/roleManager')(app, roles);
    assert.equal(false, roleManager.authorizeUserRoles(fakeUser, ['helpdesk', 'sales'], 'OR'));
  });
  it('should NOT find admin in the admin AND sales role', function () {
    var fakeUser = {username: 'admin', groups: ['users', 'leads'] };
    var roleManager = require('../../src/lib/roleManager')(app, roles);
    assert.equal(false, roleManager.authorizeUserRoles(fakeUser, ['admin', 'sales'], 'AND'));
  });
  it('should NOT find se in the admin AND sales role', function () {
    var fakeUser = {username: 'se', groups: ['users', 'engineers', 'sales'] };
    var roleManager = require('../../src/lib/roleManager')(app, roles);
    assert.equal(false, roleManager.authorizeUserRoles(fakeUser, ['admin', 'sales'], 'AND'));
  });
  it('should find sales-engineer in the helpdesk AND sales role', function () {
    var fakeUser = {username: 'se', groups: ['users', 'engineers', 'sales'] };
    var roleManager = require('../../src/lib/roleManager')(app, roles);
    assert.equal(true, roleManager.authorizeUserRoles(fakeUser, ['helpdesk', 'sales'], 'AND'));
  });
});

describe("roleManager hasRequiredRoles", function (){
  "use strict";
  it('should find admin in the admin role', function () {
    var fakeUser = {username: 'admin', groups: ['users', 'leads'] };
    var roleManager = require('../../src/lib/roleManager')(app, roles);
    assert.equal(true, roleManager.hasRequiredRoles(fakeUser, ['admin'], 'AND'));
  });
  it('should allow null user as a guest', function () {
    var fakeUser = null;
    var roleManager = require('../../src/lib/roleManager')(app, roles);
    assert.equal(true, roleManager.hasRequiredRoles(fakeUser, ['guest']));
  });
  it('should NOT allow null for other roles', function () {
    var fakeUser = null;
    var roleManager = require('../../src/lib/roleManager')(app, roles);
    assert.equal(false, roleManager.hasRequiredRoles(fakeUser, ['admin']));
  });
  it('should handle undefined roles gracefully and not grant access', function () {
    var fakeUser = {username: 'admin', groups: ['users', 'leads'] };
    var roleManager = require('../../src/lib/roleManager')(app, roles);
    assert.equal(false, roleManager.hasRequiredRoles(fakeUser, ['admininistrator']));
  });
  it('should find admin in the admin OR sales role', function () {
    var fakeUser = {username: 'admin', groups: ['users', 'leads'] };
    var roleManager = require('../../src/lib/roleManager')(app, roles);
    assert.equal(true, roleManager.hasRequiredRoles(fakeUser, ['admin', 'sales'], 'OR'));
  });
  it('should NOT find admin in the admin AND sales role', function () {
    var fakeUser = {username: 'admin', groups: ['users', 'leads'] };
    var roleManager = require('../../src/lib/roleManager')(app, roles);
    assert.equal(false, roleManager.hasRequiredRoles(fakeUser, ['admin', 'sales'], 'AND'));
  });
  it('should NOT find se in the admin AND sales role', function () {
    var fakeUser = {username: 'se', groups: ['users', 'engineers', 'sales'] };
    var roleManager = require('../../src/lib/roleManager')(app, roles);
    assert.equal(false, roleManager.hasRequiredRoles(fakeUser, ['admin', 'sales'], 'AND'));
  });
  it('should find sales-engineer in the helpdesk AND sales role', function () {
    var fakeUser = {username: 'se', groups: ['users', 'engineers', 'sales'] };
    var roleManager = require('../../src/lib/roleManager')(app, roles);
    assert.equal(true, roleManager.hasRequiredRoles(fakeUser, ['helpdesk', 'sales'], 'AND'));
  });
  it('should throw error on invalid JOIN', function () {
    assert.throws(
      function () {
        var fakeUser = {username: 'se', groups: ['users', 'engineers', 'sales'] };
        var roleManager = require('../../src/lib/roleManager')(app, roles);
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
    var roleManager = require('../../src/lib/roleManager')(app, roles);
    assert.equal(true, roleManager.hasRequiredRoles(fakeUser));
  });
});


describe("roleManager middleware", function (){
  "use strict";
  it('should add roles property to currentUser', function () {
    var fakeUser = {username: 'admin', groups: ['users', 'leads'] };
    var req = {headers: { accept: 'application/json'}, currentUser: fakeUser};
    var res = {};
    var roleManager = require('../../src/lib/roleManager')(app, roles);
    roleManager.handle(req, res, function() {
      var _ = require('underscore');
      assert.equal(2, _.intersection(req.currentUser.roles, ['users', 'admin']).length);
    });
  });
  it('should add no roles to unauthenticated user', function () {
    var req = {headers: { accept: 'application/json'}};
    var res = {};
    var roleManager = require('../../src/lib/roleManager')(app, roles);
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
    var roleManager = require('../../src/lib/roleManager')(app, roles);
    roleManager.authFailureHandler(req, res, 'test all the things');
  });

  it('should send 403 to API clients when no user authenticated', function () {
    var req = {headers: { accept: 'application/json'}};
    var res = {};
    res.send = function(code) {
      assert.equal(403, code);
    };
    var roleManager = require('../../src/lib/roleManager')(app, roles);
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
    var roleManager = require('../../src/lib/roleManager')(app, roles);
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
    var roleManager = require('../../src/lib/roleManager')(app, roles);
    roleManager.authFailureHandler(req, res, 'test all the things');
  });
});