module.exports = function() {
  "use strict";
  var codes = {};

  var findCode = function(key, done) {
    var code = codes[key];
    return done(null, code);
  };

  var saveCode = function(code, clientID, redirectURI, userID, done) {
    codes[code] = { clientID: clientID, redirectURI: redirectURI, userID: userID };
    return done(null);
  };

  var deleteCode = function(key, done) {
    delete codes[key];
    return done(null);
  };

  module.findCode = findCode;
  module.saveCode = saveCode;
  module.deleteCode = deleteCode;
  return module;
};
