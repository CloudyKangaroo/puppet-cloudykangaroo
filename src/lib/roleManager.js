module.exports = function (app) {
  "use strict";
  var ConnectRoles = require('connect-roles');

  var defaultRoles = {
    users: {
      name: 'users',
      description: 'default role, no access',
      groups: ['users'],
      users: []
    },
    helpdesk: {
      name: 'helpdesk',
      description: 'helpdesk',
      groups: ['helpdesk']
    },
    admin: {
      name: 'admin',
      description: 'Administrators',
      groups: ['helpdesk']
    },
    super: {
      name: 'super',
      description: 'super user role',
      groups: ['super'],
      users: []
    }
  };

  var nconf = require('nconf');
  var fs = require('fs');

  if (app.locals.roles) {
    nconf.defaults({
      'roles': app.locals.roles
    });
    nconf.set('roles', app.locals.roles);
  } else {
    // Check for a config file or the default location.
    var configPath = nconf.get('conf') || app.get('base_config_dir') + '/roleManagerConfig.json';

    if (configPath) {
      nconf.file({file: configPath});
    }

    nconf.defaults({
      'roles': defaultRoles
    });
  }

  var roles = nconf.get('roles');

  var registerDefaultAction = function (module, action, description, defaultRoles) {
    var roles = defaultRoles || ['super'];
    app.locals.logger.log('info', 'registered action: "' + action + '" for module "' + module + '" allowing ' + JSON.stringify(roles) + ' to access: "' + description + '"', {module: module, action: action, roles: roles, description: description});
    registerAction(module, action, description);
    authorizeRoles(action, roles);
  };

  var registerAction = function (module, action, description) {
    app.locals.logger.log('info', 'registered action: "' + action + '" for module "' + module, {module: module, action: action});
    nconf.set('actions:' + action, {module: module, action: action, description: description});
    //saveConfig(function() {});
  };

  var registerRole = function (name, description, groups, users) {
    if (arguments.length < 1) {
      app.locals.logger.log('error', 'name is required');
      return new Error('name is a required field for registerRole()');
    }
    if (name === undefined || !name || name === '') {
      app.locals.logger.log('error', 'name is required');
      return new Error('name is a required field for registerRole()');
    }
    if (description === undefined || !description || description === '') {
      description = 'no description provided';
    }
    if (arguments.length <=2) {
      users = [];
      groups = [];
    }
    if (users === undefined || !users || users === '') {
      users = [];
    }
    if (groups === undefined || !groups || groups === '') {
      groups = [];
    }
    var newRole = { name: name, description: description, groups: groups, users: users};
    nconf.set('roles:' + name, newRole);
    return newRole;
  };

  var authorizeRoles = function (action, authorizedRoles) {
    nconf.set('authorizations:' + action, authorizedRoles);
    roleHandler.use(action, function (req) {
      return hasRequiredRoles(req.currentUser, authorizedRoles, null, req);
    });
    saveConfig(function (err, results) {
      if (err) {
        app.locals.logger.log('error', 'error', { err: JSON.stringify(err)});
      } else {
        app.locals.logger.log('debug', 'saved', {results: JSON.stringify(results)});
      }
    });
  };

  var saveConfig = function (done) {
    /*nconf.save(function (err) {
      if (err) {
        done(err);
      } else {
        try {
          fs.readFile(configPath, function (err, configJSON) {
            if (err) {
              done(err);
            } else {
              var config = JSON.parse(configJSON);
              done(null, config);
            }
          });
        } catch (ex) {
          done(ex);
        }
      }
    });*/
    done(null, null);
  };

  function initializeRoles() {
    if (!roles.hasOwnProperty('users')) {
      throw new Error('Required role users is not defined');
    }
    if (!roles.hasOwnProperty('guest')) {
      registerRole('guest', 'Built-In Role for unauthenticated Users');
    }
    if (!roles.hasOwnProperty('helpdesk')) {
      registerRole('helpdesk', 'Provides access to helpdesk functionality. Also provides read-only access to monitoring.');
    }
    if (!roles.hasOwnProperty('monitoring')) {
      registerRole('monitoring', 'Provides additional access to monitoring systems.');
    }
    if (!roles.hasOwnProperty('admin')) {
      registerRole('admin', 'Provides full access to sales, monitoring and helpdesk functionality.');
    }
    if (!roles.hasOwnProperty('super')) {
      registerRole('super', 'Provides access to administrative functions.');
    }
  }

  var authFailureHandler = function (req, res, action) {
    var accept = req.headers.accept || '';
    if (req.currentUser) {
      app.locals.logger.log('debug', 'user not allowed', {action: action, groups: req.currentUser.groups, roles: req.currentUser.roles});
    } else {
      app.locals.logger.log('debug', 'user is not authenticated', {action: action, groups: []});
    }
    if (~accept.indexOf('html')) {
      if (req.session) {
        req.session.returnTo = req.originalUrl || req.url;
      }
      res.redirect('/account/login');
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

    for (var i = 0; i < userGroups.length; i++) {
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

  var authorizeUserRoles = function (user, requiredRoles, join) {
    var accessGranted = false;
    app.locals.logger.log('silly', 'authorizeUserRoles: checking user', {user: user, requiredRoles: requiredRoles});
    for (var i = 0; i < requiredRoles.length; i++) {
      var roleName = requiredRoles[i];
      if (roles.hasOwnProperty(roleName)) {
        var role = roles[roleName];
        var roleGranted = hasAccess(user, role);
        if (roleGranted === true && join === 'OR') {
          app.locals.logger.log('silly', 'returning true role granted with join OR', {roleName: roleName, username: user.username, roleGroups: role.groups, roleUsers: role.users});
          return true;
        } else if (roleGranted === true && join === 'AND') {
          app.locals.logger.log('silly', 'returning true, role granted', {roleName: roleName, username: user.username, roleGroups: role.groups, roleUsers: role.users});
          accessGranted = true;
        } else if (roleGranted === false && join === 'AND') {
          app.locals.logger.log('silly', 'returning false role not granted with join AND', {roleName: roleName, username: user.username, roleGroups: role.groups, roleUsers: role.users});
          return false;
        }
      } else {
        app.locals.logger.log('silly', 'returning false (no property)', {roleName: roleName});
        return false;
      }
    }

    return accessGranted;
  };

  var hasRequiredRoles = function (user, requiredRoles, join, req) {
    app.locals.logger.log('debug', 'Authorization Request', {requiredRoles: requiredRoles, username: user});

    if (req === undefined || ! req ){
      req = {};
      req.originalURL = 'undefined';
    }

    if (arguments.length <= 1) {
      requiredRoles = ['users'];
    }

    if (arguments.length <= 2 || join === null) {
      join = 'AND';
    }

    if (join !== 'AND' && join !== 'OR') {
      throw new Error('Invalid Join type ' + join);
    }

    var accessGranted = false;
    var _ = require('underscore');
    var message = '';

    if (user) {
      accessGranted = authorizeUserRoles(user, requiredRoles, join);
      if (accessGranted === true) {
        message = 'Authorization Granted';
      //} else if (cachedUserRoles(user, 'super'), join) {
      //  accessGranted = true;
      //  message = 'Granted with SUPER role';
      } else {
        message = 'Authorization Denied';
      }
      app.locals.logger.log('audit', message, { url: req.originalURL || req.url, requiredRoles: requiredRoles, username: user.username, userGroups: user.groups, join: join, accessGranted: accessGranted});
    } else if (_.contains(requiredRoles, 'guest')) {
      accessGranted = true;
      app.locals.logger.log('audit', 'Authorization Granted', { url: req.originalURL || req.url, requiredRoles: requiredRoles, accessGranted: accessGranted});
    } else {
      accessGranted = false;
      app.locals.logger.log('audit', 'Authorization Denied', { url: req.originalURL || req.url, requiredRoles: requiredRoles, accessGranted: accessGranted});
    }

    return accessGranted;
  };

  var getCachedRoles = function (user, getCachedRolesCallback) {
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
      if (process.env.NODE_ENV === 'test') {
        var _ = require('underscore');
        req.currentUser.roles = _.keys(roles);
        next();
      } else {
        getCachedRoles(req.currentUser, function (err, userRoles) {
          app.locals.logger.log('silly', 'roles added to user', {username: req.currentUser.username, userRoles: userRoles});
          req.currentUser.roles = userRoles;
          next();
        });
      }
    } else {
      app.locals.logger.log('silly', 'no roles added, no user');
      next();
    }
  };

  registerDefaultAction('internal', 'user', 'Minimal Authenticated Access Level', ['users']);
  registerDefaultAction('internal', 'guest', 'Minimal Access Level', ['guests']);
  registerDefaultAction('internal', 'use api', 'Minimal API Access Level', ['users']);

  initializeRoles();

  module.roleHandler = roleHandler;
  module.authorizeUserRoles = authorizeUserRoles;
  module.hasRequiredRoles = hasRequiredRoles;
  module.authFailureHandler = authFailureHandler;
  module.handle = handle;
  module.registerAction = registerAction;
  module.registerDefaultAction = registerDefaultAction;
  module.registerRole = registerRole;
  module.authorizeRoles = authorizeRoles;
  module.saveConfig = saveConfig;

  return module;
};
