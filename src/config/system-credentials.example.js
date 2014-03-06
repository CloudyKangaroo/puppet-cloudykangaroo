module.exports = function () {
  "use strict";

  var CrowdAuth = [];
  CrowdAuth.server = "https://mycrowdhostname";
  CrowdAuth.application = 'mycrowdapp';
  CrowdAuth.password = 'mycrowdpassword';

  var crmAuth = [];
  crmAuth.username = 'username';
  crmAuth.password = 'password';
  crmAuth.url = 'https://mycrmhostname/mycrmapi/api';
  crmAuth.host = 'mycrmhostname';

  module.crmAuth = crmAuth;
  module.CrowdAuth = CrowdAuth;

  return module;
};
