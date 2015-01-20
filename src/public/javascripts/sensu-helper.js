/* jshint undef: true, devel: true, unused: false, browser: true, node: false */
/*global $:false */
/*global bootbox:false */
/*global prettyPrintOne:false */

var submitSilenceJSON = function(client, check, silence, duration, ticketID, done) {
  "use strict";
  if (!client || client === '') {
    console.log('Invalid Client: ');
    console.log({client: client, check: check, silence: silence});
    return false;
  }

  if (arguments.length <= 1) {
    check = false;
  }

  if (arguments.length <= 2) {
    silence = true;
  }

  if (arguments.length <= 3) {
    duration = 4;
  }

  if (arguments.length <= 4) {
    ticketID = 'none';
  }

  if (check === 'false') {
    check = false;
  }

  var url = '/api/v1/sensu/silence/';

  var data = {expires: duration * 3600, ticketID: ticketID};

  if (check) {
    url += 'client/' + encodeURI(client) + '/check/' + encodeURI(check);
  } else {
    url += 'client/' +  encodeURI(client);
  }

  var apiMethod, verb;

  if (silence) {
    apiMethod = 'post';
    verb = 'silence';
  } else {
    apiMethod = 'delete';
    verb = 'unsilence';
  }

  $.ajax({
    url: url,
    type: apiMethod,
    dataType: 'json',
    data: data,
    success: function(response) {
      if (response.status === true)
      {
        bootbox.alert({"message": 'Completed!', "className" : "small-bootbox"});
        done(true);
      } else {

        bootbox.alert({"message": 'Failed to ' + verb + ' check: ' + response.error_message, "className" : "small-bootbox"});
        done(false);
      }
    }
  });
};

var unsilenceCheck = function(oTable, silence_stash, done) {
  "use strict";
  var splitstash = silence_stash.split('/');
  var client = splitstash[0];
  var check = splitstash[1];
  submitSilenceJSON(client, check, false, null, null, done);
  bootbox.alert({ message: silence_stash+" unsilenced. Click ok to reload the dashboard.", className: "small-bootbox", callback: function(){ oTable.fnReloadAjax('/api/v1/sensu/events/filtered'); }});
};

var confirmSilenceOrDelete = function(oTable, client, check, done) {
  "use strict";
  var check_full;
  if (check == 'false') {
    silenceCheck(oTable, client, check, done);
  } else {
    check_full = client+'/'+check;
    bootbox.dialog({
      message: "Would you like to silence or resolve "+check_full+"?",
      title: "Confirm silence or resolve",
      buttons: {
        silence: {
          label: "Silence",
          className: "btn-success",
          callback: function() { 
            silenceCheck(oTable, client, check, done);
          }
        },
        delete: {
          label: "Resolve",
          className: "btn-danger",
          callback: function() {
            deleteCheck(oTable, client, check, done);
          }
        },
        cancel: {
          label: "Cancel",
          className: "btn-primary",
          callback: function() {}
        }
     } 
    });
  }
};

var deleteCheck = function(oTable, client, check, done) {
  "use strict";
  var url = '/api/v1/sensu/delete/client/' + client;
  if (check !== false && check !== 'false') {
    url = url + '/event/' + check;
  }
  $.ajax({
  url: url,
  type: 'delete',
  dataType: 'json',
  success: function(response) {
    if (response.status === true) {
      bootbox.alert({"message": 'Completed!', "className" : "small-bootbox"});
      done(true);
    } else {
      bootbox.alert({"message": 'Failed to delete event: ' + response.error_message, "className" : "small-bootbox"});
      done(false);
    }
  }
  });
  oTable.fnReloadAjax('/api/v1/sensu/events/filtered');
};

var silenceCheck = function(oTable, client, check, done) {
  "use strict";
  bootbox.prompt({ title: "Length of time to silence in hours (<= 72)", message: "Please enter a length of time to silence: in hours, less than 72 hours.", className: "small-bootbox", value: 8, callback: function(duration) {
    if (duration === undefined) {
      return;
    } else if (duration !== null && parseInt(duration) <= 72 && parseInt(duration) >= 1) {
      submitSilenceJSON(client, check, true, duration, null, done);
      bootbox.alert({ "message": client+"/"+check+" silenced. Click ok to reload the dashboard.", "className": "small-bootbox", "callback": function(){ oTable.fnReloadAjax('/api/v1/sensu/events/filtered'); }});
    } else {
      bootbox.alert({ "message": "Length of time to silence in hours must be an integer <= 72", "className": "small-bootbox" });
    }
  }});
};

var renderButton = function(silenced, silence_stash, client, check) {
  "use strict";
  if (silenced === 1) {
    return "<button onclick=\"unsilenceCheck(oTable, '"+silence_stash+"', function(success) {});\" class=\"btn btn-default btn-xs btn-event\"><span class=\"glyphicon glyphicon-volume-up span-event active\"></span></button>";
  } else {
    return "<button onclick=\"confirmSilenceOrDelete(oTable, '"+client+"', '"+check+"', function(success) {});\" class=\"btn btn-default btn-xs btn-event\"><span class=\"glyphicon glyphicon-volume-off span-event active\"></span></button>";
  }
};

var displayTextAlert = function(text)
{
  "use strict";
  bootbox.alert('<pre class="prettyprint">' + decodeURI(text) + '</pre>');
};

var displayEventDetails = function(text)
{
  "use strict";
  //http://note19.com/2007/05/27/javascript-guid-generator/
  var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    });

  var sensuEvent = JSON.parse(decodeURI(text));
  var recipient;
  if (sensuEvent.email && sensuEvent.company) {
    recipient = '<label for="recipient">Make Sure Recipient is a valid email for: <br/>'+ sensuEvent.company +'</label>' +
      '<input class="form-control" id="' + uuid + '-recipient" value="' + sensuEvent.email + '">';
  } else {
    recipient = '<label for="recipient">Make Sure Recipient is a valid email for: <br/>No Company Specified</label>' +
      '<input class="form-control" id="' + uuid + '_recipient" value="monitor@contegix.com">';
  }

  var html =
    '<div class="container">' +
      '<div class="row">' +
        '<div class="col-md-4">' +
          '<pre>' + prettyPrintOne(decodeURI(text)) + '</pre>' +
        '</div>' +
        '<div class="col-md-6">' +
          '<form role="form" id="' + uuid + '-form">' +
            '<div class="row">' +
              '<div class="form-group">' +
                '<fieldset>' +
                  '<legend>Attach this event to a Ticket</legend>' +
                  '<label for="ticketID">Enter an existing Ticket number:</label>' +
                  '<input type="number" class="form-control" id="' + uuid + '-ticketID" placeholder="Enter a valid, existing, Ticket Number"/>' +
                  '<label>Or:&nbsp;<input id="escalate-' + uuid + '" type="checkbox">&nbsp;Escalate to a NEW ticket</label>' +
                '</fieldset>' +
              '</div>' +
            '</div>' +
            '<div class="row">' +
              '<fieldset>' +
                '<legend>Pass along any relevant documentation: </legend>' +
                '<div class="form-group">' +
                  '<textarea class="form-control" type="text" id="documentation" name="documentation" rows="4""></textarea>' +
                '</div>' +
              '</fieldset>' +
            '</div>' +
            '<input type="hidden" value="' + uuid + '" id="uuid" name="uuid">' +
            '<input type="hidden" value="' + text + '" id="event" name="event">' + recipient +
            '<button type="submit" id="' + uuid + '-submit" class="btn btn-default">Submit Ticket</button>' +
          '</form>' +
          '<script type="text/javascript">$("#escalate-' + uuid + '").click(function() { $("#' + uuid + '-ticketID").attr("disabled", this.checked); }); $( "#' + uuid + '-form" ).submit(handleTicketForm)</script>' +
        '</div>' +
      '</div>' +
    '</div>';
  bootbox.alert({"message": html, buttons: { ok: { label: "Back", className: "btn-primary"}}, "className" : "wide-bootbox"});
};

var handleTicketForm = function(event) {
  "use strict";
  event.preventDefault();

  var documentation = event.target[4].value;
  var ticketID = event.target[1].value;
  var newTicket = event.target[2].checked;
  var uuid = event.target[5].defaultValue;
  var eventJSON =  decodeURI(event.target[6].value);
  var recipient = event.target[7].value;
  var sensuEvent;

  try {
    sensuEvent = JSON.parse(eventJSON);
  } catch (e) {
    console.log('failed to parse event JSON');
    return false;
  }

  $("#" + uuid + "-submit").attr('disabled','disabled');

  var url = '/api/v1/helpdesk/tickets/';

  var data;
  if (newTicket) {
    data = {subject: sensuEvent.check + ' - ' + sensuEvent.client.replace('.contegix.mgmt', ''), sensuEvent: encodeURI(JSON.stringify(sensuEvent)), documentation: documentation, recipient: recipient, priority: sensuEvent.status, clientID: sensuEvent.clientid, deviceID: sensuEvent.dev};
    url += 'ticket';
  } else {
    data = {ticketID: ticketID, subject: 'Monitoring System Escalated Event', sensuEvent: encodeURI(JSON.stringify(sensuEvent)), documentation: documentation, visible: 1, time_spent: 1};
    url += 'ticketid/' + ticketID + '/posts';
  }

  $.ajax({
    url: url,
    type: 'post',
    dataType: 'json',
    data: data,
    success: function(response) {
      if (response.status === true)
      {
        var ticketURL = response.data.url;

        if (newTicket)
        {
          ticketID = response.data.id;
        }

        bootbox.alert({ 'message': 'Completed! Ticket Number: <a href="'+ ticketURL +'">'+ ticketID +'</a>', "className": "small-bootbox"});

        submitSilenceJSON(sensuEvent.client, sensuEvent.check, true, 96, ticketID, function (success) {
          if (success) {
            $("#" + uuid + "-submit").removeAttr('disabled');
          } else {
            $("#" + uuid + "-submit").removeAttr('disabled');
          }
        });
      } else {
        bootbox.alert({"message": 'Failed to submit post: ' + response.error_message, "className" : "small-bootbox"});
        $("#" + uuid + "-submit").removeAttr('disabled');
      }
    },
    error: function(response) {
      bootbox.alert({"message": 'Failed to submit post: ' + response.error_message, "className" : "small-bootbox"});
      $("#" + uuid + "-submit").removeAttr('disabled');
    }
  });
  event.preventDefault();
};

var syntaxHighlight = function(json) {
  "use strict";
  if (typeof json !== 'string') {
    json = JSON.stringify(json, undefined, 2);
  }
  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
    var cls = 'number';
    if (/^"/.test(match)) {
      if (/:$/.test(match)) {
        cls = 'key';
      } else {
        cls = 'string';
      }
    } else if (/true|false/.test(match)) {
      cls = 'boolean';
    } else if (/null/.test(match)) {
      cls = 'null';
    }
    return '<span class="' + cls + '">' + match + '</span>';
  });
};

// This function exists to bridge differences in event schemas between sensu 0.12 and 0.13.
// It should detect which schema is in use in the event that is passed and select the field appropriately.
var eventField = function(field, event_data) {
  "use strict";
  if (typeof event_data === 'undefined') {
    return null;
  }
  switch(field) {
    case 'status':
      if ('status' in event_data) {
        return event_data['status'];
      } else if ('status' in event_data['check']) {
        return event_data['check']['status'];
      }
      break;
    case 'client':
      if ('client' in event_data && typeof event_data['client'] === 'string') {
        return event_data['client'];
      } else if ('name' in event_data['client']) {
        return event_data['client']['name'];
      }
      break;
    case 'check':
      if ('check' in event_data && typeof event_data['check'] === 'string') {
        return event_data['check'];
      } else if ('name' in event_data['check']) {
        return event_data['check']['name'];
      }
      break;
    case 'issued':
      if ('issued' in event_data) {
        return event_data['issued'];
      } else if ('issued' in event_data['check']) {
        return event_data['check']['issued'];
      }
      break;
    case 'occurrences':
      if ('occurrences' in event_data) {
        return event_data['occurrences'];
      } else if ('occurrences' in event_data['check']) {
        return event_data['check']['occurrences'];
      }
      break;
    case 'output':
      if ('output' in event_data) {
        return event_data['output'];
      } else if ('output' in event_data['check']) {
        return event_data['check']['output'];
      }
      break;
  }
}
