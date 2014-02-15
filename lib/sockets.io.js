module.exports = function (app, config, server) {
  var io = require('socket.io').listen(server,{ log: false });
  var redis = require('redis');

  var pubsubPublisher = redis.createClient(config.redis.port, config.redis.host);

  pubsubPublisher.on("connect"
    , function () {
      pubsubPublisher.select(config.redis.pubsubdb, function (err, reply) {
        app.locals.logger.log('debug', 'pubsubClient Connected to db ' + config.redis.pubsubdb);
      });
    });

  io.sockets.on('connection', function (socket) {
    var pubsubClient = redis.createClient(config.redis.port, config.redis.host);
    var remoteIP = '';

    //remoteIP = client.handshake.headers['x-forwarded-for'] || client.handshake.address.address;

    pubsubClient.on("connect"
      , function () {
        pubsubClient.select(config.redis.pubsubdb, function (err, reply) {
          app.locals.logger.log('debug', 'pubsubClient Connected to db ' + config.redis.pubsubdb);
        });
      });

    socket.on('subscribe'
      , function(data) {
        socket.join(data.room);
        pubsubClient.subscribe(data.room);
      });

    socket.on('unsubscribe'
      , function(data) {
        socket.leave(data.room);
        pubsubClient.unsubscribe(data.room);
      });

    pubsubClient.on("message", function(channel, message) {
      var msgObj = {channel: channel, text: message, uuid:require('uuid').v4()};
      socket.in(channel).emit('popAlert', JSON.stringify(msgObj), function(data) {
        // app.locals.logger.log('debug', 'handled message', {uuid: data});
      });
    });
  });

  var publish = function(channel, message) {
    pubsubPublisher.publish(channel, message);
  }

  module.publish = publish;
  return module;
};

