module.exports = function() {
  "use strict";

  var users = require('./users')();
  var clients = require('./clients')();
  var accessTokens = require('./accesstokens')();
  var authorizationCodes = require('./authorizationcodes')();

  module.users = users;
  module.clients = clients;
  module.accessTokens = accessTokens;
  module.authorizationCodes = authorizationCodes;

  return module;
};
