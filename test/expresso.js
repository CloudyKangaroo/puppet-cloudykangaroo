var app = require('../app'),
    assert = require('assert');

module.exports = {
  'GET /account/login': function(){
    assert.response(app,
      { url: '/account/login' },
      { status: 302, headers: { 'Content-Type': 'text/html; charset=utf-8' }},
      function(res){
        assert.includes(res.body, '<title>Orchestrate</title>');
      });
  }
};
