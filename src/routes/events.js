/* jshint unused: false, sub: true */
module.exports = function (app, config, authenticator, redisClient) {
  "use strict";
  var passport = authenticator.passport;
  var formidable = require('formidable');
  var _ = require('underscore');

  var logData = function (req) {
    return {source: req.params.source, event: req.params.event, path: req.path};
  };

  var handleFormField = function(name, value, req) {
    app.locals.logger.log('debug', 'event field received', _.defaults({ type: 'event', field: name }, logData(req)));
    var ret = {};
    ret[name] = value;
    return ret;
  };

  var handleFormProgress = function(bytesReceived, bytesExpected, req) {
    var logMeta = _.defaults({ bytesReceived: bytesReceived, bytesExpected: bytesExpected}, logData(req));
    app.locals.logger.log('debug', 'incoming form data', logMeta);
  };

  var handleFormError = function(err, req) {
    var logMeta = _.defaults({ error: err }, logData(req));
    app.locals.logger.log('error', 'could not process incoming event', logMeta);
  };

  var parseForm = function(err, fields, files, req){
    var logMeta = {};

    if (err) {
      logMeta = _.defaults({ error: err }, logData(req));
      app.locals.logger.log('error', 'could not process incoming event', logMeta);
    } else {
      logMeta = _.defaults({ type: 'event', fields: fields, files: files}, logData(req));
      app.locals.logger.log('debug', 'parsing form', logMeta);
    }
  };

  var handleFileBegin = function(name, file, req) {
    var logMeta = _.defaults({name: name, file: file.toJSON()}, logData(req));
    app.locals.logger.log('debug', 'fileBegin', logMeta);
  };

  var handleFile = function (name, file, req) {
    var fs = require('fs');
    var logMeta = _.defaults({name: name, file: file.toJSON()}, logData(req));
    var filename = file.toJSON().path;
    var fileJSON = fs.readFileSync(filename,'utf8');
    var parsedJSON = {};

    app.locals.logger.log('debug', 'file', logMeta);

    try {
      parsedJSON = JSON.parse(fileJSON);
    } catch (e) {
      app.locals.logger.log('error', 'uncaught exception', _.defaults({ error: e.message }, logData(req)));
    }

    return parsedJSON;
  };

  var handleFormEnd = function(req, fields) {
    var logMeta = _.defaults({type: 'event', fields: fields}, logData(req));
    app.locals.logger.log('debug', 'event complete', logMeta);

    var username;

    if ('user' in fields)
    {
      username = fields.user;
    } else {
      username = 'none';
    }

    var ctxlog = require('contegix-logger');
    var auditLog = ctxlog('audit', config.log.level, config.log.directory, {level: config.log.screen}, {level: config.log.level});
    logMeta = _.defaults({type: 'audit', username: username}, logData(req));
    auditLog.log('info', req.path, logMeta);
  };

  app.post('/events/:source/event/:event', function(req, res){
    var form = new formidable.IncomingForm();
    var fields = {};
    var fileFields = {};
    res.send(202);

    app.locals.logger.log('debug', 'incoming event', { type: 'event',  source: req.params.source, event: req.params.event, path: req.path });

    form.parse(req, parseForm);

    form.on('field', function(name, value) {
      fields = _.defaults(fields, handleFormField(name, value, req));
    });

    form.on('progress', function(bytesReceived, bytesExpected) {
      handleFormProgress(bytesReceived, bytesExpected, req);
    });

    form.on('error', function(err) {
      handleFormError(err, req);
    });

    form.on('aborted', function() {
      app.locals.logger.log('debug', 'aborted', logData(req));
    });

    form.on('fileBegin', function(name, file) {
      handleFileBegin(name, file, req);
    });

    form.on('file', function(name, file) {
      fileFields = handleFile(name, file, req);
    });

    fields =  _.defaults(fields, fileFields);

    form.on('end', function() {
      handleFormEnd(req, fields);
    });
  });
};
