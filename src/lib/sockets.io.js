/* jshint unused: false */
module.exports = function (app, config, server) {
  "use strict";
  var io = require('socket.io').listen(server,{ log: false });

  var redis;
  if (process.env.NODE_ENV === 'test') {
    redis = require("fakeredis");
  } else {
    redis = require('redis');
  }

  var pubsubPublisher = redis.createClient(config.redis.port, config.redis.host);

  pubsubPublisher.on("connect", function () {
      pubsubPublisher.select(config.redis.pubsubdb, function (err, reply) {
        app.locals.logger.log('debug', 'pubsubClient Connected to db ' + config.redis.pubsubdb);
      });
    });

  io.sockets.on('connection', function (socket) {
    var pubsubClient = redis.createClient(config.redis.port, config.redis.host);

    pubsubClient.on("connect", function () {
        pubsubClient.select(config.redis.pubsubdb, function (err, reply) {
          app.locals.logger.log('debug', 'pubsubClient Connected to db ' + config.redis.pubsubdb);
        });
      });

    socket.on('subscribe', function(data) {
        socket.join(data.room);
        pubsubClient.subscribe(data.room);
      });

    socket.on('unsubscribe', function(data) {
        socket.leave(data.room);
        pubsubClient.unsubscribe(data.room);
      });

    pubsubClient.on("message", function(channel, message) {
      var msgObj = {channel: channel, text: message, uuid:require('./utils').uid(8)};
      socket.in(channel).emit('popAlert', JSON.stringify(msgObj), function(data) {
        app.locals.logger.log('silly', 'handled message', {uuid: data});
      });
    });
  });

  var publish = function(channel, message) {
    pubsubPublisher.publish(channel, message);
  };

  module.publish = publish;
  return module;
};
