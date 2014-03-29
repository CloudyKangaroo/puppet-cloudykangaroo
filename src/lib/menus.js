module.exports = function(params) {
  "use strict";

  var userProperty = 'user';

  if (arguments.length < 1) {
    params = {};
  }

  if (params.userProperty) {
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
      roles: ['sales', 'super'],
      content: [
        { label: 'Dashboard', key: 'dashboard', path: '/sales' },
        { label: 'New Activity', key: 'activity', path: '/sales/activity' },
        { label: 'My Accounts', key: 'accounts', path: '/sales/accounts' }
      ]
    },
    'helpdesk':
    {
      label: 'Helpdesk',
      key: 'helpdesk',
      roles: ['support', 'admin', 'super'],
      content: [
        { label: 'Dashboard', key: 'dashboard', path: '/helpdesk' },
        { label: 'Tickets', key: 'list', path: '/tickets/list' },
        { label: 'Customers', key: 'clients', path: '/helpdesk/clients' },
        { label: 'Devices', key: 'devices', path: '/helpdesk/devices' }

      ]
    },
    'monitoring':
    {
      label: 'Monitoring',
      key: 'monitoring',
      roles: ['sales', 'support', 'admin', 'super'],
      content: [
        { label: 'Dashboard', key: 'dashboard', path: '/monitoring' },
        { label: 'Alarms', key: 'events', path: '/monitoring/events' },
        { label: 'Stashes', key: 'stashes', path: '/monitoring/stashes' },
        { label: 'Puppet', key: 'puppet', path: '/monitoring/puppet' },
        { label: 'Hosts', key: 'clients', path: '/monitoring/clients' }
      ]
    },
    'instrumentation':
    {
      label: 'Instrumentation',
      key: 'instrumentation',
      roles: ['sales', 'support', 'admin', 'super'],
      content: [
        { label: 'Dashboard', key: 'dashboard', path: '/monitoring' },
        { label: 'Graphs', key: 'graphs', path: '/instrumentation/graphs' },
        { label: 'Log Viewer', key: 'logviewer', path: '/instrumentation/logs' },
        { label: 'Signage', key: 'signage', path: '/instrumentation/graphs' }
      ]
    },
    'admin':
    {
      label: 'Admin',
      key: 'admin',
      roles: ['admin', 'super'],
      content: [
        { label: 'Dashboard', key: 'dashboard', path: '/admin' },
        { label: 'Access Control', key: 'security', path: '/admin/security' },
        { label: 'Audit Log', key: 'events', path: '/admin/audit' }
      ]
    }
  };

  module.addMenuItem = function (section, label, key, path) {
    var _ = require('underscore');
    var menuItem = {label: label, key: key, path: path};
    if (_.contains(section[section].content, menuItem)) {
      return false;
    } else {
      navSections[section].content.push(menuItem);
      return true;
    }
  };

  module.handle = function(req, res, next) {
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
          matches = _.intersection(user.roles, section.roles);
          if (matches.length) {
            matchedSections[sectionName] = section;
          }
        }
      }
    } else {
      matchedSections = unauthenticatedMenu;
    }

    req.navSections = matchedSections;
    next();
  };

  return module;
};