/*
 Example Log Usage:

 Invocation:

 logger.log('info', 'Test Log Message', { anything: 'This is metadata' });

 Emits:

 info: Test Log Message anything=This is metadata

 Invocation:

 logger.log('debug', 'Storing ' + bytes + ' as support.ticket_count.high');

 Emits:

 debug: Storing 3 bytes as support.ticket_count.high

 */

/*
Using in a module:

 var ctxlog = require('../../ctxlog');
 var logger = ctxlog('modulename');

Using the main instance:

 var ctxlog = require('./lib/ctxlog');
 var logger = ctxlog('main');

 */
var winston = require('winston');
var logPath = '/var/log/cloudykangaroo';
var _ = require('underscore');
var mkdirp = require('mkdirp');

mkdirp(logPath, function(err) {
  if (err) console.log('could not initialize logging class, could not create logpath: ' + logPath);
});

var logFile =  logPath + '/' + 'main.log';

var consoleDefaults = { level: 'info',  colorize: true, handleExceptions: true };
var fileDefaults =  { level: 'info', filename: logFile, handleExceptions: true };

/*
var logger = new (winston.Logger)({ transports: [
  new (winston.transports.Console)(consoleDefaults),
  new (winston.transports.File)(fileDefaults)
]});
*/

createLogger = function createLogger(module, level, consoleOpts, fileOpts) {
  if (level && level != '' && level != {})
  {
    consoleDefaults.level = level;
    fileDefaults.level = level;
  }

  if (!(module || module == ''))
  {
    module = 'main';
  }

  if(!(consoleOpts || consoleOpts == '' || consoleOpts == {}))
  {
    consoleOpts = consoleDefaults;
  } else {
    _.defaults(consoleOpts,consoleDefaults);
  }

  if(!(fileOpts || fileOpts == '' || fileOpts == {}))
  {
    fileOpts = fileDefaults;
  } else {
    _.defaults(fileOpts,fileDefaults);
  }

  fileOpts.filename = logPath + '/' + module + '.log';

  winston.loggers.add(module, {
    console: consoleOpts,
    file: fileOpts
  });

  thisLogger = winston.loggers.get(module);

  thisLogger.log = function(){
    var args = arguments;

    if (arguments.length == 1) {
      args[1] = 'debug';
      args[2] = {};
    }

    if (arguments.length == 2) {
      args[2] = {};
    }

    /*
        Every log entry should have these standard metadata entries.
     */
    var eventID = require('uuid').v4();

    if (this.req)
    {
      var sessionID = this.req.sessionID;
      var requestID = this.req.id;

      if (this.req.user)
      {
        var username = this.req.user.username;
      } else {
        var username = 'none';
      }
    } else {
        var sessionID = 'none';
        var requestID = 'none';
        var username = 'none';
    }

    _.defaults(args[2], { type: 'applog', username: username, eventID: eventID, requestID: requestID, sessionID: sessionID });

    winston.Logger.prototype.log.apply(this,args);
  }
  return thisLogger;
}

module.exports = createLogger;