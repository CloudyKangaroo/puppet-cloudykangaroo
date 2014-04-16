module.exports = function() {
  "use strict";

  var tokens = {};

  var find = function (key, done) {
    var token = tokens[key];
    return done(null, token);
  };

  var save = function(token, userID, clientID, done) {
    tokens[token] = { userID: userID, clientID: clientID };
    return done(null);
  };

  module.find = find;
  module.save = save;
  return module;
};
