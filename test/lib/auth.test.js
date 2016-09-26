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
