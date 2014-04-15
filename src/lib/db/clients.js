module.exports = function() {
  "use strict";

  var clients = [
    {
      id: '1',
      name: 'Samplr',
      clientID: 'abc123',
      clientSecret: 'ssh-secret',
      redirectURI: 'http://localhost:3006/auth/keeper/callback'
    }
  ];

  var find = function(id, done) {
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

  var findByClientID = function(clientID, done) {
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

  var remove = function(id, done) {
    done(clients.splice(id, 1));
  };

  var create = function(name, clientID, redirectURI, done) {
    var clientSecret = require('uuid').v4();
    var client = {id: 5, name: name, clientID: clientID, clientSecret: clientSecret, redirectURI: redirectURI};
    clients.push(client);
    done(null, client);
  };

  var getAll = function(done) {
    var _ = require('underscore');
    done(_.omit(clients, 'clientSecret'));
  };

  module.find = find;
  module.findByClientID = findByClientID;
  module.remove = remove;
  module.create = create;
  module.getAll = getAll;
  return module;
};
