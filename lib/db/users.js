var _ = require('underscore');

var users = [
  { id: '1', username: 'bob', password: 'secret', name: 'Bob Smith' },
  { id: '2', username: 'joe', password: 'password', name: 'Joe Davis' },
  { id: '40',username: 'jonathan.creasy', fullname:'Jonathan Creasy','emails':[{'value':'jonathan.creasy@contegix.com'}],'type':'admin','groups':['Support Engineers','DevOps'],'profile':{'id':'40','login':'jonathan.creasy','access':{'brands':{'1':0},'api':2,'client_billing':'1'},'roles':{'6':{'role_id':'6','name':'DevOps','access':{'client_acctmgmt':'2','client_comments':'2','client_contact_info':'2','client_opportunities':'2','client_quotes':'2','client_quotes_all':'2','client_quotes_approval':'1','client_reports':'2','client_services':'2','cm_reports':'1','config_access':'2','department.1':'2','department.2':'2','department.4':'2','department.5':'2','department.7':'2','devicemgr':'2','dm_reports':'1','global_reports':'1','ordermgr':'2','sales_leads':'2','sales_opportunities':'2','sm_reports':'1'}}},'auth_brands':{'all_brands':'full'},'auth_roles':{'3':{'role_id':'3','name':'Support Engineers','access':{'client_acctmgmt':'2','client_comments':'2','client_contact_info':'2','client_quotes':'1','client_quotes_approval':'2','client_reports':'2','client_services':'2','cm_reports':'1','department.1':'2','department.2':'2','department.3':'2','department.4':'2','department.5':'2','department.7':'2','devicemgr':'2','dm_reports':'1','dm_settings':'2','global_reports':'1','monitor_info':'2','order_queue.4':'2','order_step.1':'2','order_step.19':'2','order_step.2':'2','order_step.3':'2','order_step.4':'2','sales_leads':'2','sales_opportunities':'2','sm_reports':'1'}},'6':{'role_id':'6','name':'DevOps','access':{'client_acctmgmt':'2','client_comments':'2','client_contact_info':'2','client_opportunities':'2','client_quotes':'2','client_quotes_all':'2','client_quotes_approval':'1','client_reports':'2','client_services':'2','cm_reports':'1','config_access':'2','department.1':'2','department.2':'2','department.4':'2','department.5':'2','department.7':'2','devicemgr':'2','dm_reports':'1','global_reports':'1','ordermgr':'2','sales_leads':'2','sales_opportunities':'2','sm_reports':'1'}}},'class_id':'1','active':'1','client_id':null,'contact_id':null,'fullname':'Jonathan Creasy','email':'jonathan.creasy@contegix.com','last_login':'1392653042','password_timeout':'0','password_changed':'0','auth_module_id':'1','password_expired':'0','type':'admin'}}
];

var defaultUser = { id: '0', name: 'Development User', username: 'development.user', emails: [{name: 'primary', value: 'development.user@contegix.com'}], groups: ['users']};

exports.find = function(id, done) {
  for (var i = 0, len = users.length; i < len; i++) {
    var user = users[i];
    if (user.id === id) {
      return done(null, _.defaults(user, defaultUser));
    }
  }
  return done(null, null);
};

exports.addUser = function(newUser, done) {
  var found = false;

  for (var i = 0, len = users.length; i < len; i++) {
    var user = users[i];
    if (user.id === newUser.id) {
      users[i] = newUser;
      done(null, newUser);
      found = true;
      i = len;
    };
  };

  if (!found) {
    users.push(newUser);
    done(null, newUser);
  };
};

exports.findByUsername = function(username, done) {
  for (var i = 0, len = users.length; i < len; i++) {
    var user = users[i];
    if (user.username === username) {
      return done(null, _.defaults(user, defaultUser));
    }
  }
  return done(null, null);
};
