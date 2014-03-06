var codes = {};

exports.find = function(key, done) {
  "use strict";
  var code = codes[key];
  return done(null, code);
};

exports.save = function(code, clientID, redirectURI, userID, done) {
  "use strict";
  codes[code] = { clientID: clientID, redirectURI: redirectURI, userID: userID };
  return done(null);
};

exports.delete = function(key, done) {
  "use strict";
  delete codes[key];
  return done(null);
};
