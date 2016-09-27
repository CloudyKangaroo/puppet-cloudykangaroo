/*global it:false */
/*global describe:false */
process.env.NODE_ENV = 'test';
process.env.LOG_DIR = './';

var credentials = require('../../src/config/system-dev-credentials')();

var app = {};
app.base_config_dir =  __dirname + '/config';

app.locals = {};
app.locals.logger = {};
app.locals.logger.log = function (text) {
    "use strict";
};

var config = {};

config.mgmtDomain = '.unittest.us';

config.log = {};
config.log.level = 'hide';
config.log.screen = 'hide';
config.log.directory = '/tmp';

config.redis = {};
config.redis.port = '6379';
config.redis.host = 'localhost';
config.redis.db = 1;

//var redis = require("fakeredis");
//var redisClient = redis.createClient(config.redis.port, config.redis.host);

var assert = require('assert');

var db = {};
db.clients = {};
db.clients.findClientByID = function (username, returnClient) {

};


describe("auth authenticateClientLocally", function () {
    "use strict";
    it('should lookup client', function () {
        var providedUsername = 'testUser';
        var providedPassword = 'testUser';
        var redisClient = {};
        var db = {};
        db.clients = {};
        db.clients.findByClientId = function (expectedUsername, returnClient) {
            assert.equal(providedUsername, expectedUsername);
        };
        app.locals.db = db;
        var auth = require('../../src/lib/auth')(app, credentials, config, redisClient);
        auth.authenticateClientLocally(providedUsername, providedPassword, function () {});
    });
    it('should authenticate client with matching password', function () {
        var providedUsername = 'testUser';
        var providedPassword = 'testUser';
        var providedClient =  {
            id: '1',
            name: 'testUser',
            clientID: 'abc123',
            clientSecret: 'testUser',
            redirectURI: 'http://localhost:3006/auth/keeper/callback'
        };
        var redisClient = {};
        var db = {};
        db.clients = {};
        db.clients.findByClientId = function (expectedUsername, returnClient) {
            returnClient(null,providedClient);
        };
        app.locals.db = db;
        var auth = require('../../src/lib/auth')(app, credentials, config, redisClient);
        auth.authenticateClientLocally(providedUsername, providedPassword, function (err, expectedClient) {
            assert.equal(providedClient, expectedClient);
        });
    });
    it('should not authenticate client after db error', function () {
        var providedUsername = 'testUser';
        var providedPassword = 'testUser';
        var providedClient =  {
            id: '1',
            name: 'testUser',
            clientID: 'abc123',
            clientSecret: 'testUser',
            redirectURI: 'http://localhost:3006/auth/keeper/callback'
        };
        var redisClient = {};
        var db = {};
        db.clients = {};
        db.clients.findByClientId = function (expectedUsername, returnClient) {
            returnClient(new Error('could not find client'), null);
        };
        app.locals.db = db;
        var auth = require('../../src/lib/auth')(app, credentials, config, redisClient);
        auth.authenticateClientLocally(providedUsername, providedPassword, function (err, expectedClient) {
            assert.deepEqual(new Error('could not find client'), err);
            assert.equal(null, expectedClient);
        });
    });
    it('should not authenticate client that cannot be found', function () {
        var providedUsername = 'testUser';
        var providedPassword = 'testUser';
        var providedClient =  {
            id: '1',
            name: 'testUser',
            clientID: 'abc123',
            clientSecret: 'testUser',
            redirectURI: 'http://localhost:3006/auth/keeper/callback'
        };
        var redisClient = {};
        var db = {};
        db.clients = {};
        db.clients.findByClientId = function (expectedUsername, returnClient) {
            returnClient(null, null);
        };
        app.locals.db = db;
        var auth = require('../../src/lib/auth')(app, credentials, config, redisClient);
        auth.authenticateClientLocally(providedUsername, providedPassword, function (err, expectedClient) {
            assert.equal(false, expectedClient);
        });
    });
    it('should not authenticate client with non-matching password', function () {
        var providedUsername = 'testUser';
        var providedPassword = 'testUser';
        var providedClient =  {
            id: '1',
            name: 'testUser',
            clientID: 'abc123',
            clientSecret: 'false',
            redirectURI: 'http://localhost:3006/auth/keeper/callback'
        };
        var redisClient = {};
        var db = {};
        db.clients = {};
        db.clients.findByClientId = function (expectedUsername, returnClient) {
            returnClient(null,providedClient);
        };
        app.locals.db = db;
        var auth = require('../../src/lib/auth')(app, credentials, config, redisClient);
        auth.authenticateClientLocally(providedUsername, providedPassword, function (err, expectedClient) {
            assert.equal(false, expectedClient);
        });
    });
});

describe("auth authenticateUserLocally", function () {
    "use strict";
    var providedUsername = 'development.user';
    var providedPassword = 'testUser';
    var providedUser =  { id: '0', name: 'Development User', password: providedPassword, username: 'development.user', type:'admin', emails: [{name: 'primary', value: 'development.user@contegix.com'}], groups: ['users', 'engineers', 'devops', 'sales', 'super']};
    it('should lookup user', function () {
        var redisClient = {};
        var db = {};
        db.users = {};
        db.users.findByUsername = function (expectedUsername, returnUser) {
            assert.equal(providedUsername, expectedUsername);
        };
        app.locals.db = db;
        var auth = require('../../src/lib/auth')(app, credentials, config, redisClient);
        auth.authenticateUserLocally(providedUsername, providedPassword, function () {});
    });
    it('should authenticate user with matching password', function () {
        var redisClient = {};
        var db = {};
        db.users = {};
        db.users.findByUsername = function (expectedUsername, returnUser) {
            returnUser(null, providedUser);
        };
        app.locals.db = db;
        var auth = require('../../src/lib/auth')(app, credentials, config, redisClient);
        auth.authenticateUserLocally(providedUsername, providedPassword, function (err, expectedUser) {
            assert.equal(providedUser, expectedUser);
        });
    });
    it('should not authenticate user after db error', function () {
        var redisClient = {};
        var db = {};
        db.users = {};
        db.users.findByUsername = function (expectedUsername, returnUser) {
            returnUser(new Error('could not find user'), null);
        };
        app.locals.db = db;
        var auth = require('../../src/lib/auth')(app, credentials, config, redisClient);
        auth.authenticateUserLocally(providedUsername, providedPassword, function (err, expectedUser) {
            assert.deepEqual(err, new Error('could not find user'));
            assert.equal(null, expectedUser);
        });
    });
    it('should not authenticate user that cannot be found', function () {
        var redisClient = {};
        var db = {};
        db.users = {};
        db.users.findByUsername = function (expectedUsername, returnUser) {
           returnUser(null, null);
        };
        app.locals.db = db;
        var auth = require('../../src/lib/auth')(app, credentials, config, redisClient);
        auth.authenticateUserLocally(providedUsername, providedPassword, function (err, expectedUser) {
            assert.equal(false, expectedUser);
        });
    });
    it('should not authenticate user with non-matching password', function () {
        var redisClient = {};
        providedUser.password = 'secret';
        var db = {};
        db.users = {};
        db.users.findByUsername = function (expectedUsername, returnUser) {
           returnUser(null, providedUser);
        };
        app.locals.db = db;
        var auth = require('../../src/lib/auth')(app, credentials, config, redisClient);
        auth.authenticateUserLocally(providedUsername, providedPassword, function (err, expectedUser) {
            assert.equal(false, expectedUser);
        });
    });
});

describe("auth authenticateAccessToken", function () {
    "use strict";
    var providedTokenKey = 'development.user';
    var providedToken = {'token': providedTokenKey, userID: 'development.user'};
    var providedPassword = 'testUser';
    var providedInfo = { scope: '*' };
    var providedUser =  { id: '0', name: 'Development User', password: providedPassword, username: 'development.user', type:'admin', emails: [{name: 'primary', value: 'development.user@contegix.com'}], groups: ['users', 'engineers', 'devops', 'sales', 'super']};
    it('should lookup token', function () {
        var redisClient = {};
        var db = {};
        db.users = {};
        db.users.find = function (expectedUsername, returnUser) {
            return providedUser;
        };
        db.accessTokens = {};
        db.accessTokens.find = function (expectedToken, returnToken) {
            assert.equal(providedToken, expectedToken);
        };
        app.locals.db = db;
        var auth = require('../../src/lib/auth')(app, credentials, config, redisClient);
        auth.authenticateAccessToken(providedToken, function () {});
    });
    it('should authenticate valid token', function () {
        var redisClient = {};
        var db = {};
        db.users = {};
        db.users.find = function (expectedUsername, returnUser) {
            return providedUser;
        };
        db.accessTokens = {};
        db.accessTokens.find = function (expectedToken, returnToken) {
            returnToken(null, {token: providedToken});
        };
        app.locals.db = db;
        var auth = require('../../src/lib/auth')(app, credentials, config, redisClient);
        auth.authenticateAccessToken(providedToken, function (err, expectedUser, expectedInfo) {
            assert.equal(null, err);
            assert.equal(providedInfo, expectedInfo);
            assert.equal(providedUser, expectedUser);
        });
    });
});

describe("auth serializeUser", function (){
    "use strict";
    it('should store a serialized user', function () {
        var expectedUser ='{id: 0}';
        var providedUser ={ id: '0', name: 'Development User', username: 'development.user', type:'admin', emails: [{name: 'primary', value: 'development.user@contegix.com'}], groups: ['users', 'engineers', 'devops', 'sales', 'super']};
        var redisClient = {};
        redisClient.set = function (key, value) {
            assert.equal(key, 'user:0');
            assert.equal(value, JSON.stringify(providedUser));
        };
        var auth = require('../../src/lib/auth')(app, credentials, config, redisClient);
        auth.serializeUser(providedUser, function(err, userID) {});
    });
    it('should return a userID', function () {
        var expectedUser ='{id: 0}';
        var providedUser ={ id: '0', name: 'Development User', username: 'development.user', type:'admin', emails: [{name: 'primary', value: 'development.user@contegix.com'}], groups: ['users', 'engineers', 'devops', 'sales', 'super']};
        var redisClient = {};
        redisClient.set = function (key, value) {};
        var auth = require('../../src/lib/auth')(app, credentials, config, redisClient);
        auth.serializeUser(providedUser, function(err, userID) {
            assert.equal(0, userID);
        });
    });
    it('should not return a userID when redis store fails', function () {
        var providedUser ={ id: '0', name: 'Development User', username: 'development.user', type:'admin', emails: [{name: 'primary', value: 'development.user@contegix.com'}], groups: ['users', 'engineers', 'devops', 'sales', 'super']};
        var redisClient = {};
        var expectedError = new Error('redis set failed');
        redisClient.set = function (key, value, respond) {
            respond(expectedError, null);
        };
        var auth = require('../../src/lib/auth')(app, credentials, config, redisClient);
        auth.serializeUser(providedUser, function (err, userID) {
            assert.deepEqual(err, expectedError);
            assert.deepEqual(null, userID);
        });
    });
});

describe("auth deserializeUser", function (){
    "use strict";
    it('should request a serialized user', function () {
        var userObject ={ id: '0', name: 'Development User', username: 'development.user', type:'admin', emails: [{name: 'primary', value: 'development.user@contegix.com'}], groups: ['users', 'engineers', 'devops', 'sales', 'super']};
        var redisClient = {};
        redisClient.get = function (userID, returnUser) {
            assert.equal('user:0', userID);
            returnUser(null, userObject);
        };
        var auth = require('../../src/lib/auth')(app, credentials, config, redisClient);
        auth.deserializeUser(0, function(err, returnedUser) {});
    });
    it('should return a user object', function () {
        var userObject ={ id: '0', name: 'Development User', username: 'development.user', type:'admin', emails: [{name: 'primary', value: 'development.user@contegix.com'}], groups: ['users', 'engineers', 'devops', 'sales', 'super']};
        var redisClient = {};
        redisClient.get = function (userID, returnUser) {
            returnUser(null, JSON.stringify(userObject));
        };
        var auth = require('../../src/lib/auth')(app, credentials, config, redisClient);
        auth.deserializeUser(0, function(err, returnedUser) {
            assert.notEqual(err, Error);
            assert.deepEqual(returnedUser, userObject);
        });
    });
    it('should not return a user object if redis request fails', function () {
        var userObject ={ id: '0', name: 'Development User', username: 'development.user', type:'admin', emails: [{name: 'primary', value: 'development.user@contegix.com'}], groups: ['users', 'engineers', 'devops', 'sales', 'super']};
        var redisClient = {};
        redisClient.get = function (userID, returnUser) {
            returnUser(new Error('redis request failed'), null);
        };
        var auth = require('../../src/lib/auth')(app, credentials, config, redisClient);
        auth.deserializeUser(0, function(err, returnedUser) {
            assert.deepEqual(err, new Error('redis request failed'));
            assert.notDeepEqual(returnedUser, userObject);
        });
    });
});
