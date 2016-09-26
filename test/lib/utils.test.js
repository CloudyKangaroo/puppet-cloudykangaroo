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

var assert = require('assert');

describe("utils getFormattedISO8601", function (){
    "use strict";
    it('should return an ISO8601 formatted timestamp', function () {
        var req = {};
        var utils = require('../../src/lib/utils');
        assert.equal('2016-06-19T12:15:11-07:00', utils.getFormattedISO8601('2016-06-20 01:15:11+6'));
    });
    it('should return MMM DD H:mm:ss', function () {
        var req = {};
        var utils = require('../../src/lib/utils');
        assert.equal('Jun 19 12:15:11', utils.getFormattedISO8601('2016-06-20 01:15:11+6', 'MMM DD H:mm:ss'));
    });
});

describe("utils getFormattedTimestamp", function (){
    "use strict";
    it('should return an MMM DD H:mm:ss', function () {
        var req = {};
        var utils = require('../../src/lib/utils');
        assert.equal('Jun 19 5:15:11', utils.getFormattedTimestamp('1466338511'));
    });
    it('should return MMM DD', function () {
        var req = {};
        var utils = require('../../src/lib/utils');
        assert.equal('Jun 19', utils.getFormattedTimestamp('1466338511', 'MMM DD'));
    });
});
