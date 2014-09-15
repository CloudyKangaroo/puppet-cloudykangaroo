module.exports = function (app, config, authenticator) {
  "use strict";

  var lib = require('./lib');

  var moduleName = 'sales';

  app.locals.addMenuContent({ section: moduleName, label: 'Dashboard', key: 'dashboard', path: '/sales' });
  app.locals.addMenuContent({ section: moduleName, label: 'New Activity', key: 'activity', path: '/sales/activity' });
  app.locals.addMenuContent({ section: moduleName, label: 'New Lead', key: 'newlead', path: '/sales/lead/new' });
  app.locals.addMenuContent({ section: moduleName, label: 'Lead Listing', key: 'lead', path: '/sales/lead' });
  app.locals.addMenuContent({ section: moduleName, label: 'Recent Activities', key: 'activityview', path: '/sales/activity/view' });
  //app.locals.addMenuContent({ section: moduleName, label: 'My Accounts', key: 'accounts', path: '/sales/accounts' });

  app.locals.leadActivity = [];

  authenticator.roleManager.registerDefaultAction(moduleName, 'submit activity', 'Submit new Activites related to leads and accounts', ['sales']);
  authenticator.roleManager.registerDefaultAction(moduleName, 'submit new lead', 'Create new Leads', ['sales']);
  authenticator.roleManager.registerDefaultAction(moduleName, 'view all activity', 'Submit new Activites related to leads and accounts', ['sales']);
  authenticator.roleManager.registerDefaultAction(moduleName, 'view all accounts', 'View existing account and lead non-billing information', ['sales']);
  authenticator.roleManager.registerDefaultAction(moduleName, 'view dashboard', 'View existing account and lead non-billing information', ['sales']);

  app.get('/sales', authenticator.roleHandler.can('view dashboard'), function (req, res) {
    app.locals.crmModule.getSalesPipeline(true, function (err, pipeline) {
      if (err) {
        res.send(500);
      } else {
        var stages = {};
        var stageItems = pipeline.stats.stages;
        for (var stageID in stageItems) {
          if (stageItems.hasOwnProperty(stageID)) {
            var stageItemOpen = lib.retrieveStageItem(stageItems[stageID], '1') || {sum: 0, values: []};
            var stageItemWon = lib.retrieveStageItem(stageItems[stageID], '2') || {sum: 0, values: []};
            var stageItemLost = lib.retrieveStageItem(stageItems[stageID], '4') || {sum: 0, values: []};
            var accounting = require('accounting');
            accounting.settings.currency.precision = "0";
            stages[stageID] = {};
            stages[stageID].open = {sum: accounting.formatMoney(stageItemOpen.sum), count: stageItemOpen.values.length};
            stages[stageID].won = {sum: accounting.formatMoney(stageItemWon.sum), count: stageItemWon.values.length};
            stages[stageID].lost = {sum: accounting.formatMoney(stageItemLost.sum), count: stageItemLost.values.length};
          }
        }
        var renderParams = {
          user: req.currentUser,
          section: moduleName,
          key: 'dashboard',
          metadata: pipeline.metadata,
          pipeline: pipeline.pipeline,
          summary: pipeline.summarizedStats,
          stages: stages,
          navSections: req.navSections
        };
        res.render('sales', renderParams);
      }
    });
  });

  app.get('/sales/lead/new', authenticator.roleHandler.can('submit new lead'), function (req, res) {
    var renderParams = {
      user: req.currentUser,
      section: moduleName,
      key: 'newlead',
      navSections: req.navSections
    };
    res.render(__dirname + '/views/lead/new', renderParams);
  });

  app.post('/sales/lead/new', authenticator.roleHandler.can('submit new lead'), function (req, res) {

    var first = req.body.firstname;
    var last = req.body.lastname;
    var company = req.body.company;
    var email = req.body.email;
    var phone = req.body.phone;
    var address1 = req.body.address1;
    var address2 = req.body.address2;
    var city = req.body.city;
    var state = req.body.state;
    var zip = req.body.zip;
    var country = req.body.country;

    app.locals.crmModule.submitNewLead(first, last, company, email, address1 + "\n" + address2, city, state, zip, country, phone, function (err, data) {
      if (err) {
        res.send(500);
      } else {
        res.redirect('/helpdesk/clients/clientid/' + data.data);
      }
    });
  });

  app.get('/sales/accounts', authenticator.roleHandler.can('view all accounts'), function (req, res) {
    app.locals.crmModule.getClientByKeyword('innovate', function (err, clients) {
      if (err) {
        res.send(500);
      } else {
        var renderParams = {
          user: req.currentUser,
          section: moduleName,
          key: 'activity',
          clients: clients,
          navSections: req.navSections
        };
        res.render(__dirname + '/views/accounts', renderParams);
      }
    });
  });

  app.get('/sales/activity', authenticator.roleHandler.can('submit activity'), function (req, res) {
    app.locals.crmModule.getLeads(function (err, leads) {
      if (err) {
        res.send(500);
      } else {
        var renderParams = {
          user: req.currentUser,
          section: moduleName,
          key: 'activity',
          leads: leads,
          navSections: req.navSections
        };
        res.render(__dirname + '/views/activity', renderParams);
      }
    });
  });

  app.post('/sales/activity', authenticator.roleHandler.can('submit activity'), function (req, res) {
    var commentJSON = JSON.stringify({ data: { formData: req.body, user: req.currentUser}});
    var lineSeperator = "\n";
    var fieldSeperator = "|";
    var commentData = "###\n" +
      "Lead Activity By   " + fieldSeperator + "   " + req.currentUser.username + "   " + fieldSeperator + lineSeperator +
      "Contact Method   " + fieldSeperator + "   " + req.body.contactMethod + "   " + fieldSeperator + lineSeperator +
      "Contact Notes   " + fieldSeperator + "   " + req.body.contactMethodNotes + "   " + fieldSeperator + lineSeperator +
      "Disposition   " + fieldSeperator + "   " + req.body.contactDisposition + "   " + fieldSeperator + lineSeperator +
      "Disposition Notes    " + fieldSeperator + "   " + req.body.contactDispositionNotes + "   " + fieldSeperator + lineSeperator +
      "Followup   " + fieldSeperator + "   " + req.body.contactFollowup + "   " + fieldSeperator + lineSeperator +
      "Followup Notes   " + fieldSeperator + "   " + req.body.contactFollowupNotes + "   " + fieldSeperator + lineSeperator +
      "Followup Date   " + fieldSeperator + "   " + req.body.followupDate + "   " + fieldSeperator + lineSeperator;

    app.locals.crmModule.submitComment('client', req.body.leadSelector, commentData, req.currentUser.username, commentJSON, function (err) {
      if (err) {
        res.send(500);
      } else {
        app.locals.leadActivity.push(commentJSON);
        res.redirect('/sales/activity/view');
      }
    });
  });

  app.get('/sales/lead', authenticator.roleHandler.can('view all accounts'), function (req, res) {
    res.render(__dirname + '/views/lead', { user: req.currentUser, section: moduleName, key: 'lead', navSections: req.navSections  });
  });

  /*
   This function is just bad, it's really really bad. I should feel bad, I do feel bad. I will rewrite it.
   */
  app.get('/sales/activity/view', authenticator.roleHandler.can('view all activity'), function (req, res) {
    app.locals.crmModule.getLeads(function (err, leads) {
      var async = require('async');
      var _ = require('underscore');
      async.map(_.values(leads), function (lead, callback) {
        app.locals.crmModule.getClientComments(lead.clientid, callback);
      }, function (err, leadComments) {
        if (err) {
          res.send(500);
        } else {
          async.concat(_.values(leadComments), function (leadComment, callback) {
            var commentIDList = [];
            for (var j = 0; j < leadComment.length; j++) {
              var comment = leadComment[j];
              if (comment.comment.substring(0, 3) === '###') {
                commentIDList.push(comment.comment_id);
              }
            }
            callback(null, commentIDList);
          }, function (err, commentIDList) {
            async.map(commentIDList, function (commentID, callback) {
              app.locals.crmModule.getCommentAttachments(commentID, callback);
            }, function (err, attachmentListing) {
              if (err) {
                res.send(500);
              } else {
                async.map(attachmentListing, function (attachmentObjectList, callback) {
                  callback(null, _.values(attachmentObjectList));
                }, function (err, attachmentObjects) {
                  if (err) {
                    res.send(500);
                  } else {
                    async.concat(attachmentObjects, function (attachmentObject, callback) {
                      callback(null, attachmentObject);
                    }, function (err, attachmentObjects) {
                      async.map(attachmentObjects, function (attachmentItem, callback) {
                        app.locals.crmModule.getAttachment(attachmentItem.attach_id, callback);
                      }, function (err, attachments) {
                        if (err) {
                          res.send(500);
                        } else {
                          var renderParams = {
                            user: req.currentUser,
                            section: moduleName,
                            key: 'activityview',
                            activities: attachments,
                            navSections: req.navSections
                          };
                          res.render(__dirname + '/views/activity/view', renderParams);
                        }
                      });
                    });
                  }
                });
              }
            });
          });
        }
      });
    });
  });

  /*
   var renderParams = {
   user:req.currentUser,
   section: 'sales',
   key:  'activityview',
   activities: app.locals.leadActivity,
   navSections: req.navSections
   };
   res.render(__dirname + '/views/activity/view', renderParams);
   */

  module.name = moduleName;
  return module;
};