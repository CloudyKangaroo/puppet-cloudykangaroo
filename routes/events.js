/**
 * Created with JetBrains WebStorm.
 * User: jonathan
 * Date: 14/01/2014
 * Time: 18:25
 * To change this template use File | Settings | File Templates.
 */
module.exports = function (app, config, passport, redisClient) {
  var formidable = require('formidable');
  var _ = require('underscore');

  app.post('/events/:source/event/:event'
    , function(req, res){
      var form = new formidable.IncomingForm;
      var fields = {};

      app.locals.logger.log('debug', 'incoming event', { type: 'event',  source: req.params.source, event: req.params.event, path: req.path })

      form.parse(req, function(err, fields, files){
        if (err) {
          app.locals.logger.log('error', 'could not process incoming event', { error: err,  source: req.params.source, event: req.params.event, path: req.path });
          res.send(500);
        }
	      app.locals.logger.log('debug', 'parsing form', { type: 'event', fields: fields, files: files,  source: req.params.source, event: req.params.event });
      });

      form.on('field', function(name, value) {
        app.locals.logger.log('debug', 'event field received', { type: 'event', field: name,  source: req.params.source, event: req.params.event, value: value });
        fields[name] = value;
      });

      form.on('progress', function(bytesReceived, bytesExpected) {
        app.locals.logger.log('debug', 'incoming form data', { bytesReceived: bytesReceived, bytesExpected: bytesExpected });
      });

      form.on('error', function(err) {
        app.locals.logger.log('error', 'could not process incoming event', { error: err,  source: req.params.source, event: req.params.event, path: req.path });
        res.send(500);
      });

      form.on('aborted', function() {
        app.locals.logger.log('debug', 'aborted', { });
      });
      form.on('fileBegin', function(name, file) {
        app.locals.logger.log('debug', 'fileBegin', { name: name, file: file.toJSON() });
      });

      form.on('file', function(name, file) {
        var fs = require('fs');
        app.locals.logger.log('debug', 'file', { name: name, file: file.toJSON() });
        var filename = file.toJSON().path;
        var fileJSON = fs.readFileSync(filename,'utf8');
       try {
       var parsedJSON = JSON.parse(fileJSON);
       }
       catch (e) {
           app.locals.logger.log('error', 'uncaught exception', { err: e});
       }
        _.defaults(fields, parsedJSON);
      });

      form.on('end', function() {
        app.locals.logger.log('debug', 'event complete', { type: 'event',  source: req.params.source, event: req.params.event, fields: fields});

        if ('user' in fields)
        {
           var username = fields['user'];
        } else {
          var username = 'none';
        }

        app.locals.audit.log('info', req.path, { type: 'audit', source: req.params.source, event: req.params.event, fields: fields, username: username, requestID: req.id, sessionID: req.sessionID })
        // 202 Accepted
        res.send(202);
      });
    });
}
