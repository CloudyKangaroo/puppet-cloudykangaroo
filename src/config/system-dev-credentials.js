module.exports = function () {
  "use strict";

  var CrowdAuth = function() {
    var ret = {};
    ret.server = '';
    ret.application = '';
    ret.password = '';
    return ret;
  };

  var crmAuth = function() {
    var ret = {};
    ret.username = '';
    ret.password = '';
    ret.url = '';
    ret.host = '';
    return ret;
  };

  module.crmAuth = crmAuth;
  module.CrowdAuth = CrowdAuth;

  return module;
};