var request = require('nodeunit-express');
// require the express application, notice how we exported the express app using `module.exports` above
var app = require('../app');

// This is a nodeunit test example
exports.testGet = function(test){
  var express = request(app);
  express.get('/').expect(function(response) {
    // response is the response from hitting '/'
    test.equal(response.body, "ok");
    test.equal(response.statusCode, 302);
    test.equal(response.headers['content-type'], "text/html");
    test.done();
    express.close();
  });
}
