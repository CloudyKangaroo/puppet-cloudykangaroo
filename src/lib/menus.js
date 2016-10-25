module.exports = function(params, logger) {
  "use strict";

  var userProperty = 'currentUser';

  if (arguments.length < 1) {
    params = {};
  }

  if (params.hasOwnProperty('userProperty')) {
    userProperty = params.userProperty;
  }

  var unauthenticatedMenu = {
    'account': {
      label: 'Account',
      key: 'account',
      roles: [],
      content: [
        { label: 'Login', key: 'login', path: '/account/login' }
      ]
    }
  };

  var navSections = {
    'monitoring':
    {
      label: 'Monitoring',
      key: 'monitoring',
      roles: ['sales', 'helpdesk', 'admin', 'super'],
      content: [
        { label: 'Dashboard', key: 'dashboard', path: '/monitoring' },
        { label: 'Events', key: 'events', path: '/monitoring/events' },
        { label: 'Stashes', key: 'stashes', path: '/monitoring/stashes' },
        { label: 'Puppet', key: 'puppet', path: '/monitoring/puppet' },
        { label: 'Hosts', key: 'clients', path: '/monitoring/clients' }
      ]
    },
    'instrumentation':
    {
      label: 'Instrumentation',
      key: 'instrumentation',
      roles: ['super'],
      content: [
        { label: 'Dashboard', key: 'dashboard', path: '/monitoring' },
        { label: 'Graphs', key: 'graphs', path: '/instrumentation/graphs' },
        { label: 'Log Viewer', key: 'logviewer', path: '/instrumentation/logs' },
        { label: 'Signage', key: 'signage', path: '/instrumentation/signage' }
      ]
    },
    'admin':
    {
      label: 'Admin',
      key: 'admin',
      roles: ['super'],
      content: [
        { label: 'Dashboard', key: 'dashboard', path: '/admin' },
        { label: 'Access Control', key: 'security', path: '/admin/security' },
        { label: 'Audit Log', key: 'events', path: '/admin/audit' }
      ]
    }
  };

  var addMenuContent = function (menuItem) {
    if (menuItem.hasOwnProperty('section')) {
      if (navSections.hasOwnProperty(menuItem.section)) {
        if (!navSections[menuItem.section].hasOwnProperty('content')) {
          navSections[menuItem.section].content = [];
        }
        navSections[menuItem.section].content.push(menuItem);
        return true;
      } else {
        throw new Error('could not add menu item section not found: ' + menuItem.section);
      }
    } else {
      throw new Error('could not add menu item no section defined');
    }
  };

  var addMenuSection = function(section, label, key, roles) {
    var menuSection = { label: label, key: key, roles: roles};
    logger.log('debug', 'Adding menu section', {section: section, menuSection: menuSection});
    navSections[section] = menuSection;
  };

  var addMenuItem = function (section, label, key, path, roles) {
    var menuItem = {section: section, label: label, key: key, path: path, roles: roles};
    logger.log('debug', 'Adding menu item', {menuItem: menuItem});
    addMenuContent(menuItem);
  };

  var buildMenu = function(req, next) {
    var _ = require('underscore');

    var matchedSections = {};
    var section = {};
    var matches = [];
    var user = {};
    if (!req.hasOwnProperty(userProperty) || !req[userProperty].hasOwnProperty('roles')) {
      req.app.locals.logger.log('debug', 'Req has no user, or user has no roles', {userProperty: userProperty});
      matchedSections = unauthenticatedMenu;
    } else {
      user = req[userProperty];
      for (var sectionName in navSections) {
        if (navSections.hasOwnProperty(sectionName)) {
          section = navSections[sectionName];
          if (section.hasOwnProperty('roles')) {
            if (!user.hasOwnProperty('roles').length) {
              var newSection = {
                label: section.label,
                key: section.key,
                roles: section.roles,
                content: []
              };
              var content = section.content;
              for(var i=0; i<content.length; i++) {
                var menuItem = content[i];
                if (menuItem) {
                  if (!menuItem.hasOwnProperty('roles')) {
                    menuItem.roles = section.roles;
                  }
                  if (_.intersection(user.roles, menuItem.roles).length) {
                    req.app.locals.logger.log('silly', 'found match', {userRoles: user.roles, menuItemRoles: menuItem.roles});
                    newSection.content.push(menuItem);
                  }
                }
              }
              if (newSection.content.length >= 1) {
                matchedSections[sectionName] = newSection;
              }
            } else {
              req.app.locals.logger.log('silly', 'No intersection of roles', {userRoles: user.roles, sectionRoles: section.roles});
            }
          } else {
            throw new Error('section has no roles defined: ' + sectionName);
          }
        }
      }
    }
    req.app.locals.logger.log('silly', 'menu build complete', {navSections: matchedSections});
    req.navSections = matchedSections;
    next();
  };

  module.addMenuSection = addMenuSection;
  module.addMenuContent = addMenuContent;
  module.addMenuItem = addMenuItem;

  module.handle = function(req, res, next) {
    buildMenu(req, next);
  };

  return module;
};
