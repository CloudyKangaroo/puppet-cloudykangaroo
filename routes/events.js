/**
 * Created with JetBrains WebStorm.
 * User: jonathan
 * Date: 14/01/2014
 * Time: 18:25
 * To change this template use File | Settings | File Templates.
 */
module.exports = function (app, config, passport, redisClient) {
  var formidable = require('formidable');

  app.post('/events/ubersmith/event/:event'
    , function(req, res){
      var form = new formidable.IncomingForm;

      app.locals.logger.log('debug', 'incoming event', { event: req.params.event, path: req.path })

      form.parse(req, function(err, fields, files){
        if (err) {
          app.locals.logger.log('error', 'could not process incoming event', { error: err, event: req.params.event, path: req.path });
          res.send(500);
        }
        console.log(fields);
      });

      form.on('progress', function(bytesReceived, bytesExpected) {
        //    console.log(bytesReceived + ' ' + bytesExpected);
      });

      form.on('error', function(err) {
        app.locals.logger.log('error', 'could not process incoming event', { error: err, event: req.params.event, path: req.path });
        res.send(500);
      });

      // 202 Accepted
      res.send(202);
    });
}
