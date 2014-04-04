module.exports = function(app, roles) {
  "use strict";

  var cacheManager = require('cache-manager');
  var memoryCache = cacheManager.caching({store: 'memory', max: 2048, ttl: 10/*seconds*/});
  var ConnectRoles = require('connect-roles');

  function initializeRoles() {
    if (!roles.hasOwnProperty('users')) {
      throw new Error('Required role users is not defined');
    }
    if (!roles.hasOwnProperty('guest')) {
      roles.guest = {
        name: 'guest',
        description: 'Built-In Role for unauthenticated Users',
        groups: [],
        users: []
      };
    }
    if (!roles.hasOwnProperty('sales')) {
      roles.sales = {
        name: 'sales',
        description: 'Provides access to lead and account management functionality. Also provides read-only access to monitoring.',
        groups: [],
        users: []
      };
    }
    if (!roles.hasOwnProperty('helpdesk')) {
      roles.helpdesk = {
        name: 'helpdesk',
        description: 'Provides access to helpdesk functionality. Also provides read-only access to monitoring.',
        groups: [],
        users: []
      };
    }
    if (!roles.hasOwnProperty('monitoring')) {
      roles.monitoring = {
        monitoring: {
          name: 'monitoring',
          description: 'Provides additional access to monitoring systems.',
          groups: ['engineers'],
          users: []
        }
      };
    }
    if (!roles.hasOwnProperty('admin')) {
      roles.admin = {
        monitoring: {
          name: 'admin',
          description: 'Provides full access to sales, monitoring and helpdesk functionality.',
          groups: [],
          users: []
        }
      };
    }
    if (!roles.hasOwnProperty('super')) {
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
    if (req.currentUser) {
      app.locals.logger.log('debug', 'user not allowed', {action: action, groups: req.currentUser.groups});
    } else {
      app.locals.logger.log('debug', 'user is not authenticated', {action: action, groups: []});
    }
    if (~accept.indexOf('html')) {
      res.render('account/login', { message: req.flash('error') });
    } else {
      res.send(403);
    }
  };

  var roleHandler = new ConnectRoles({
    failureHandler: authFailureHandler
  });

  function hasRoleGroups(userGroups, role) {
    var _ = require('underscore');
    var roleGroups = role.groups;

    for (var i=0; i<userGroups.length; i++) {
      var userGroup = userGroups[i];

      app.locals.logger.log('silly', 'hasRoleGroups: checking userGroup', { roleGroups: roleGroups, userGroup: userGroup});

      if (_.contains(roleGroups, userGroup)) {
        app.locals.logger.log('silly', 'hasRoleGroups: returning true', {roleName: role.name, userGroups: userGroups, roleGroups: roleGroups});
        return true;
      }
    }
    app.locals.logger.log('silly', 'hasRoleGroups: returning false', {roleName: role.name, userGroups: userGroups, roleGroups: roleGroups});
    return false;
  }

  var hasAccess = function (user, role) {
    var _ = require('underscore');
    app.locals.logger.log('silly', 'hasAccess: checking user', { role: role.name, user: user.username, roleUsers: role.users});
    if (_.contains(role.users, user.username)) {
      return true;
    } else {
      return hasRoleGroups(user.groups, role);
    }
  };

  /* Placeholder for When I make this Async */
  var cachedUserRoles = function(user, requiredRoles, join) {
    return authorizeUserRoles(user, requiredRoles, join);
  };

  var authorizeUserRoles = function (user, requiredRoles, join) {
    var accessGranted = false;
    app.locals.logger.log('silly', 'authorizeUserRoles: checking user', {user: user, requiredRoles:  requiredRoles});
    for (var i=0; i<requiredRoles.length;i++) {
      var roleName = requiredRoles[i];
      if (roles.hasOwnProperty(roleName)) {
        var role = roles[roleName];
        var roleGranted = hasAccess(user, role);
        if (roleGranted === true && join === 'OR') {
          app.locals.logger.log('silly', 'returning true role granted with join OR', {roleName: roleName, username:user.username, roleGroups: role.groups, roleUser: role.users});
          return true;
        } else if (roleGranted === true && join === 'AND') {
          app.locals.logger.log('silly', 'returning true, role granted', {roleName: roleName, username:user.username, roleGroups: role.groups, roleUser: role.users});
          accessGranted = true;
        } else if (roleGranted === false && join === 'AND') {
          app.locals.logger.log('silly', 'returning false role not granted with join AND', {roleName: roleName, username:user.username, roleGroups: role.groups, roleUser: role.users});
          return false;
        }
      } else {
        app.locals.logger.log('silly', 'returning false (no property)', {roleName: roleName});
        return false;
      }
    }

    return accessGranted;
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
    var _ = require('underscore');

    if (user) {
      accessGranted = cachedUserRoles(user, requiredRoles, join);
      app.locals.logger.log('debug', 'returning ' + accessGranted, {requiredRoles: requiredRoles, username: user.username, userGroups: user.groups, join: join, accessGranted: accessGranted});
    } else if (_.contains(requiredRoles, 'guest')) {
      accessGranted = true;
      app.locals.logger.log('debug', 'returning ' + accessGranted, {requiredRoles: requiredRoles, accessGranted: accessGranted});
    } else {
      accessGranted = false;
      app.locals.logger.log('debug', 'returning ' + accessGranted, {requiredRoles: requiredRoles, accessGranted: accessGranted});
    }

    return accessGranted;
  };

  var getCachedRoles = function(user, getCachedRolesCallback) {
    /*
    memoryCache.wrap('roleManager::getCachedRoles::' + user.username, function (cb) {
      getRoles(user, cb);
    }, function (err, userRoles) {
      getCachedRolesCallback(err, userRoles);
    });
    */
    getRoles(user, getCachedRolesCallback);
  };

  var getRoles = function (user, getRolesCallback) {
    var userRoles = [];
    for (var roleName in roles) {
      if (roles.hasOwnProperty(roleName)) {
        var role = roles[roleName];
        if (hasAccess(user, role)) {
          if (role.hasOwnProperty('name')) {
            userRoles.push(role.name);
          }
        }
      }
    }
    getRolesCallback(null, userRoles);
  };

  var handle = function (req, res, next) {
    if (req.hasOwnProperty('currentUser')) {
      getCachedRoles(req.currentUser, function (err, userRoles) {
        req.currentUser.roles = userRoles;
        next();
      });
    } else {
      app.locals.logger.log('debug', 'no roles added, no user');
      next();
    }
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

  var isGuest = function (req) {
    if (req.hasOwnProperty('currentUser')) {
      return hasRequiredRoles(req.currentUser, ['guest']);
    } else {
      return hasRequiredRoles(null, ['guest']);
    }

  };

  roleHandler.use('user', isUsers);
  roleHandler.use('guest', isGuest);

  roleHandler.use('use api', isUsers);

  roleHandler.use('view customers', function (req) {
    return isSales(req) || isHelpdesk(req) || isAdmin(req) || isSuper(req);
  });

  roleHandler.use('submit lead activity', function (req) {
    return isSales(req) || isAdmin(req) || isSuper(req);
  });

  roleHandler.use('view leads', function (req) {
    return isSales(req) || isAdmin(req) || isSuper(req);
  });

  roleHandler.use('edit leads', function (req) {
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
  module.authorizeUserRoles = authorizeUserRoles;
  module.hasRequiredRoles = hasRequiredRoles;
  module.authFailureHandler = authFailureHandler;
  module.handle = handle;
  module.isUsers = isUsers;
  module.isSales = isSales;
  module.isGuest = isGuest;
  module.isHelpdesk = isHelpdesk;
  module.isMonitoring = isMonitoring;
  module.isAdmin = isAdmin;
  module.isSuper = isSuper;

  return module;
};