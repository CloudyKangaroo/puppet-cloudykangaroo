/**
 * Return a random int, used by `utils.uid()`
 *
 * @param {Number} min
 * @param {Number} max
 * @return {Number}
 * @api private
 */

var getRandomInt = function(min, max) {
  "use strict";
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Return a unique identifier with the given `len`.
 *
 *     utils.uid(10);
 *     // => "FDaS435D2z"
 *
 * @param {Number} len
 * @return {String}
 * @api private
 */
exports.uid = function(len) {
  "use strict";
  var buf = [];
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charlen = chars.length;

  for (var i = 0; i < len; ++i) {
    buf.push(chars[getRandomInt(0, charlen - 1)]);
  }

  return buf.join('');
};

exports.getFormattedTimestamp = function (timeStamp, dateString) {
  "use strict";
  var moment = require('moment-timezone');
  moment.tz.setDefault(process.env.TZ);
  if (arguments.length === 1) {
    dateString = 'MMM DD H:mm:ss';
  }
  return moment(timeStamp * 1000).format(dateString);
};

exports.getFormattedISO8601 = function (timeStamp, dateString) {
  "use strict";
  var moment = require('moment-timezone');
  moment.tz.setDefault(process.env.TZ);
  if (arguments.length === 1) {
    dateString = require('moment').ISO_8601;
  }
  return moment(timeStamp).toISOString();
};
