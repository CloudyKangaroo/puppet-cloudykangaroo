module.exports = function(app, roles) {
  "use strict";
  var ConnectRoles = require('connect-roles');

  var authFailureHandler = function (req, res, action) {
    var accept = req.headers.accept || '';
    if (~accept.indexOf('html')) {
      app.locals.logger.log('debug', 'user not allowed', {action: action, groups: req.currentUser.groups});
      res.send(403);
    } else {
      app.locals.logger.log('debug', 'user not allowed', {action: action, groups: req.currentUser.groups});
      res.send(403);
    }
  };

  var roleManager = new ConnectRoles({
    failureHandler: authFailureHandler
  });

  var hasAccess = function (user, role) {
    var _ = require('underscore');
    app.locals.logger.log('silly', 'checking user', { user: user.username, users: role.users});
    if (_.contains(role.users, user.username)) {
      return true;
    }
    var groups = user.groups;
    for (var i=0; i<groups.length; i++) {
      app.locals.logger.log('silly', 'checking group', { group: groups[i], groups: role.groups});
      if (_.contains(role.groups, groups[i])) {
        return true;
      }
    }
    return false;
  };

  var isUser = function (user) {
    return hasAccess(user, roles.users);
  };

  var isUsers = function (req) {
    return isUser(req.currentUser) && hasAccess(req.currentUser, roles.users);
  };

  var isSales = function (req) {
    return hasAccess(req.currentUser, roles.sales);
  };

  var isSupport = function (req) {
    return hasAccess(req.currentUser, roles.support);
  };

  var isAdmin = function (req) {
    return hasAccess(req.currentUser, roles.admin);
  };

  var isSuper = function (req) {
    return hasAccess(req.currentUser, roles.super);
  };

  roleManager.use('user', function (req) {
    return isUser(req.currentUser);
  });

  roleManager.use('view customers', isSupport);
  roleManager.use('view leads', isSales);
  roleManager.use('edit leads', isSales);
  roleManager.use('view devices', isUsers);
  roleManager.use('view monitoring', isUsers);
  roleManager.use('deactivate customers', isSuper);
  roleManager.use('decommission device', isSupport);
  roleManager.use('issue credit', isSuper);
  roleManager.use('view monitoring events', isUsers);
  roleManager.use('silence monitoring events',isSupport);


  module.roleManager = roleManager;
  module.isUsers = isUsers;
  module.isSales = isSales;
  module.isSupport = isSupport;
  module.isAdmin = isAdmin;
  module.isSuper = isSuper;

  return module;
};