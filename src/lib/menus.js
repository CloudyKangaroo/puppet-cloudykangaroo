module.exports = function(params) {
  "use strict";

  var userProperty = 'user';

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
    'sales':
    {
      label: 'Sales',
      key: 'sales',
      roles: ['sales', 'admin', 'super']
    },
    'helpdesk':
    {
      label: 'Helpdesk',
      key: 'helpdesk',
      roles: ['helpdesk', 'admin', 'super'],
      content: [
        { label: 'Dashboard', key: 'dashboard', path: '/helpdesk' },
        { label: 'Customers', key: 'clients', path: '/helpdesk/clients' },
        { label: 'Devices', key: 'devices', path: '/helpdesk/devices' }

      ]
    },
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

  var addMenuItem = function (section, label, key, path, roles) {
    var menuItem = {section: section, label: label, key: key, path: path, roles: roles};
    addMenuContent(menuItem);
  };

  var buildMenu = function(req, next) {
    var _ = require('underscore');

    var matchedSections = {};
    var section = {};
    var matches = [];
    var user = {};

    if (req.hasOwnProperty(userProperty)) {
      user = req[userProperty];
      for (var sectionName in navSections) {
        if (navSections.hasOwnProperty(sectionName)) {
          section = navSections[sectionName];
          if (section.hasOwnProperty('roles')) {
            matches = _.intersection(user.roles, section.roles);
            if (matches.length) {
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
                  var menuItemRoles = menuItem.roles;
                  menuItemRolesLoop:
                  for (var j=0; j<menuItemRoles.length; j++) {
                    var menuItemRole = menuItemRoles[j];
                    if (user.hasOwnProperty('roles')) {
                      if (_.contains(user.roles, menuItemRole)) {
                        newSection.content.push(menuItem);
                        break menuItemRolesLoop;
                      } // else user does not have any roles for this menuItem
                    } //else user has no roles
                  }
                }
              }
              if (newSection.content.length >= 1) {
                matchedSections[sectionName] = newSection;
              }
            }
          } else {
            throw new Error('section has no roles defined: ' + sectionName);
          }
        }
      }
    } else {
      matchedSections = unauthenticatedMenu;
    }

    req.navSections = matchedSections;
    next();
  };

  module.addMenuContent = addMenuContent;
  module.addMenuItem = addMenuItem;
  module.handle = function(req, res, next) {
    buildMenu(req, next);
  };

  return module;
};
