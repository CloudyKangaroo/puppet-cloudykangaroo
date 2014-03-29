module.exports = function(app, roles) {
  "use strict";

  var ConnectRoles = require('connect-roles');

  function initializeRoles() {
    if (!roles.users) {
      throw new Error('Required role users is not defined');
    }
    if (!roles.sales) {
      roles.sales = {
        name: 'sales',
        description: 'Provides access to lead and account management functionality. Also provides read-only access to monitoring.',
        groups: [],
        users: []
      };
    }
    if (!roles.helpdesk) {
      roles.helpdesk = {
        name: 'helpdesk',
        description: 'Provides access to helpdesk functionality. Also provides read-only access to monitoring.',
        groups: [],
        users: []
      };
    }
    if (!roles.monitoring) {
      roles.monitoring = {
        monitoring: {
          name: 'monitoring',
          description: 'Provides additional access to monitoring systems.',
          groups: ['engineers'],
          users: []
        }
      };
    }
    if (!roles.admin) {
      roles.admin = {
        monitoring: {
          name: 'admin',
          description: 'Provides full access to sales, monitoring and helpdesk functionality.',
          groups: [],
          users: []
        }
      };
    }
    if (!roles.super) {
      roles.super = {
        super: {
          name: 'super',
          description: 'Provides access to administrative functions.',
          groups: [],
          users: []
        }
      };
    }
  }

  var authFailureHandler = function (req, res, action) {
    var accept = req.headers.accept || '';
    if (~accept.indexOf('html')) {
      if (req.currentUser) {
        app.locals.logger.log('debug', 'user not allowed', {action: action, groups: req.currentUser.groups});
      } else {
        app.locals.logger.log('debug', 'user is not authenticated', {action: action, groups: []});
      }
      res.render('account/login', { message: req.flash('error') });
    } else {
      app.locals.logger.log('debug', 'user not allowed', {action: action, groups: req.currentUser.groups});
      res.send(403);
    }
  };

  var roleHandler = new ConnectRoles({
    failureHandler: authFailureHandler
  });

  function hasRoleGroups(userGroups, role) {
    var _ = require('underscore');
    for (var i=0; i<userGroups.length; i++) {
      var group = userGroups[i];
      app.locals.logger.log('silly', 'checking group', { group: group, groups: role.groups});
      if (_.contains(role.groups, group)) {
        return true;
      }
    }
    return false;
  }

  var hasAccess = function (user, role) {
    var _ = require('underscore');
    app.locals.logger.log('silly', 'checking user', { user: user.username, users: role.users});
    if (_.contains(role.users, user.username)) {
      return true;
    } else {
      return hasRoleGroups(user.groups, role);
    }
  };

  var hasRequiredRoles = function(user, requiredRoles, join) {
    if (arguments.length <= 1) {
      requiredRoles = ['users'];
    }

    if (arguments.length <= 2) {
      join = 'AND';
    }

    if (join !== 'AND' && join !== 'OR') {
      throw new Error('Invalid Join type ' + join);
    }

    var accessGranted = false;

    for (var i=0; i<requiredRoles.length;i++) {
      var roleName = requiredRoles[i];
      if (roles.hasOwnProperty(roleName)) {
        var role = roles[roleName];
        var roleGranted = hasAccess(user, role);
        if (roleGranted === true && join === 'OR') {
          app.locals.logger.log('debug', 'returning true role granted with join OR ' + roleName);
          return true;
        } else if (roleGranted === true && join === 'AND') {
          app.locals.logger.log('debug', 'returning true, role granted: ' + roleName);
          accessGranted = true;
        } else if (roleGranted === false && join === 'AND') {
          app.locals.logger.log('debug', 'returning false role not granted with join AND: ' + roleName);
          return false;
        }
      } else {
        app.locals.logger.log('debug', 'returning false (no property) ' + roleName);
        return false;
      }
    }

    app.locals.logger.log('debug', 'returning ' + accessGranted);
    return accessGranted;
  };

  var isUsers = function (req) {
    return hasRequiredRoles(req.currentUser, ['users']);
  };

  var isSales = function (req) {
    return hasRequiredRoles(req.currentUser, ['users', 'sales']);
  };

  var isHelpdesk = function (req) {
    return hasRequiredRoles(req.currentUser, ['users', 'helpdesk']);
  };

  var isMonitoring = function (req) {
    return hasRequiredRoles(req.currentUser, ['users', 'monitoring']);
  };

  var isAdmin = function (req) {
    return hasRequiredRoles(req.currentUser, ['users', 'admin']);
  };

  var isSuper = function (req) {
    return hasRequiredRoles(req.currentUser, ['users', 'super']);
  };

  var handle = function (req, res, next) {
    var userRoles = [];
    for (var roleName in roles) {
      if (roles.hasOwnProperty(roleName)) {
        var role = roles[roleName];
        if (hasAccess(req.currentUser, role)) {
          if (role.hasOwnProperty('name')) {
            userRoles.push(role.name);
          }
        }
      }
    }
    req.currentUser.roles = userRoles;
    next();
  };

  roleHandler.use('user', isUsers);
  roleHandler.use('use api', isUsers);

  roleHandler.use('view customers', function (req) {
    return isSales(req) || isHelpdesk(req) || isAdmin(req) || isSuper(req);
  });

  roleHandler.use('view leads', function (req) {
    return isSales(req) || isAdmin(req) || isSuper(req);
  });

  roleHandler.use('edit leads', function (req) {
    return isSales(req) || isAdmin(req) || isSuper(req);
  });
  roleHandler.use('view devices', function (req) {
    return isHelpdesk(req) || isAdmin(req) || isSuper(req);
  });
  roleHandler.use('view accounts', function (req) {
    return isHelpdesk(req) || isAdmin(req) || isSuper(req);
  });
  roleHandler.use('view tickets', function (req) {
    return isHelpdesk(req) || isAdmin(req) || isSuper(req);
  });
  roleHandler.use('view monitoring', function (req) {
    return isSales(req) || isHelpdesk(req) || isAdmin(req) || isSuper(req);
  });
  roleHandler.use('deactivate customers', isSuper);
  roleHandler.use('decommission device', function (req) {
    return isAdmin(req) || isSuper(req);
  });
  roleHandler.use('issue credit', isSuper);
  roleHandler.use('view monitoring events',  function (req) {
    return isSales(req) || isHelpdesk(req) || isAdmin(req) || isSuper(req);
  });
  roleHandler.use('view helpdesk tickets', function (req) {
    return isHelpdesk(req) || isAdmin(req) || isSuper(req);
  });
  roleHandler.use('view helpdesk devices', function (req) {
    return isHelpdesk(req) || isAdmin(req) || isSuper(req);
  });
  roleHandler.use('view helpdesk device detail', function (req) {
    return isHelpdesk(req) || isAdmin(req) || isSuper(req);
  });
  roleHandler.use('view helpdesk clients', function (req) {
    return isHelpdesk(req) || isAdmin(req) || isSuper(req);
  });
  roleHandler.use('view helpdesk', isUsers);
  roleHandler.use('view helpdesk client detail', function (req) {
    return isHelpdesk(req) || isAdmin(req) || isSuper(req);
  });
  roleHandler.use('silence monitoring events', function (req) {
    return isHelpdesk(req) || isAdmin(req) || isSuper(req);
  });

  initializeRoles();

  module.use = roleHandler.use;
  module.can = roleHandler.can;
  module.is = roleHandler.is;
  module.userCan = roleHandler.userCan;
  module.userIs = roleHandler.userIs;
  module.roleHandler = roleHandler;
  module.handle = handle;
  module.isUsers = isUsers;
  module.isSales = isSales;
  module.isHelpdesk = isHelpdesk;
  module.isMonitoring = isMonitoring;
  module.isAdmin = isAdmin;
  module.isSuper = isSuper;

  return module;
};