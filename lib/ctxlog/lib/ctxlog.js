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

var winston = require('winston');

var logFile =  './logs/' + moment().format("MM-DD-YYYY") + '.main.log';

var logger = new (winston.Logger)({ transports: [
  new (winston.transports.Console)({ level: 'debug',  colorize: true }),
  new (winston.transports.File)({ level: 'debug', filename: logFile })
]});

createLogger = function createLogger(module) {
  if (module != '')
  {
    var moduleLogger = winston.loggers.get(module);
    if (moduleLogger)
    {
      return moduleLogger;
    } else {
      var logFile =  './logs/' + moment().format("MM-DD-YYYY") + '.' + module + '.log';
      var options = {
        console: { level: 'debug',  colorize: true },
        file: { level: 'debug', filename: logFile }
      };

      winston.loggers.add(module, options);
      return winston.loggers.get(module);
    }
  } else {
    return logger;
  }
}

module.exports = createLogger;