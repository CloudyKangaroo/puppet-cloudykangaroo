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
  var buf = []
    , chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    , charlen = chars.length;

  for (var i = 0; i < len; ++i) {
    buf.push(chars[getRandomInt(0, charlen - 1)]);
  }

  return buf.join('');
};

/**
 * Return a random int, used by `utils.uid()`
 *
 * @param {Number} min
 * @param {Number} max
 * @return {Number}
 * @api private
 */

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

exports.getFormattedTimestamp = function (timeStamp, dateString) {
  var moment = require('moment');
  if (arguments.length == 1) {
    var dateString = 'MMM DD H:mm:ss';
  }
  var offset = moment(timeStamp * 1000);
  return offset.format(dateString);
}

exports.getFormattedISO8601 = function (timeStamp, dateString) {
  var moment = require('moment');
  if (arguments.length == 1) {
    var dateString = 'MMM DD H:mm:ss';
  }
  var offset = moment(timeStamp);
  return offset.format(dateString);
}