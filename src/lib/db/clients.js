var clients = [
  {
    id: '1',
    name: 'Samplr',
    clientID: 'abc123',
    clientSecret: 'ssh-secret',
    redirectURI: 'http://client.ghostlab.net:3006/auth/keeper/callback'
  }
];

exports.find = function(id, done) {
  "use strict";
  var retClient = null;
  var retError = null;

  for (var i = 0, len = clients.length; i < len; i++) {
    var client = clients[i];
    if (client.id === id) {
      retClient = client;
      break;
    }
  }

  if (!retClient) {
    retError = {code: 404, message: 'could not find user with id '+ id};
  }

  return done(retError, retClient);
};

exports.findByClientID = function(clientID, done) {
  "use strict";
  var retClient = null;
  var retError = null;
  var client = {};

  for (var i = 0, len = clients.length; i < len; i++) {
    client = clients[i];
    if (client.clientID === clientID) {
      retClient = client;
      break;
    }
  }

  if (!retClient) {
    retError = {code: 404, message: 'could not find user with id '+ clientID};
  }

  return done(retError, retClient);
};
