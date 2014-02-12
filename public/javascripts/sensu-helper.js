var renderButton = function(silenced, silence_stash, client, check) {
  if (silenced == 1) {
    return "<button onclick=\"unsilenceCheck(oTable, '"+silence_stash+"');\" class=\"btn btn-default btn-xs btn-event\"><span class=\"glyphicon glyphicon-volume-up span-event active\"></span></button>"
  } else {
    return "<button onclick=\"silenceCheck(oTable, '"+client+"', '"+check+"');\" class=\"btn btn-default btn-xs btn-event\"><span class=\"glyphicon glyphicon-volume-off span-event active\"></span></button>"
  }
}

var unsilenceCheck = function(oTable, silence_stash) {
  splitstash = silence_stash.split('/');
  var client = splitstash[0];
  var check = splitstash[1];
  submitSilenceJSON(client, check, false);
  bootbox.alert({ message: silence_stash+" unsilenced. Click ok to reload the dashboard.", className: "small-bootbox", callback: function(){ location.reload() }})
}

var silenceCheck = function(oTable, client, check) {
  bootbox.prompt({ title: "Length of time to silence in hours (<= 72)", message: "Please enter a length of time to silence: in hours, less than 72 hours.", className: "small-bootbox", value: 8, callback: function(duration) {
    if (result == undefined) {
      return;
    } else if (result != null && parseInt(duration) <= 72) {

      submitSilenceJSON(client, check, true, duration);
      bootbox.alert({ "message": client+"/"+check+" silenced. Click ok to reload the dashboard.", "className": "small-bootbox", "callback": function(){ location.reload() }})
    } else {
      bootbox.alert({ "message": "Length of time to silence in hours must be an integer <= 72", "className": "small-bootbox" })
    }
  }})
}

var submitSilenceJSON = function(client, check, silence, duration) {

  if (!client || client == '') {
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

  if (check === 'false') {
    check = false;
  }

  var url = '/api/v1/sensu/silence/';

  var data = {expires: duration * 3600};

  if (check) {
    url += 'client/' + encodeURI(client) + '/check/' + encodeURI(check);
  } else {
    url += 'client/' +  encodeURI(client);
  }

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
    success: function(data) {
      var response = JSON.parse(data);
      if (response.status == true)
      {
        bootbox.alert({"message": 'Completed!', "className" : "small-bootbox"});
        $("#" + uuid + "-submit").removeAttr('disabled')
      } else {
        bootbox.alert({"message": 'Failed to ' + verb + ' check: ' + response.error_message, "className" : "small-bootbox"});
        $("#" + uuid + "-submit").removeAttr('disabled')
      }
    }
  });
}
var displayTextAlert = function(text)
{
  bootbox.alert('<pre class="prettyprint">' + decodeURI(text) + '</pre>');
}

var displayEventDetails = function(text)
{
  //http://note19.com/2007/05/27/javascript-guid-generator/
  var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    });

  var sensuEvent = JSON.parse(decodeURI(text));

  if (sensuEvent.email && sensuEvent.company) {
    var recipient = '<label for="recipient">Make Sure Recipient is a valid email for: <br/>'+ sensuEvent.company +'</label>' +
      '<input type="email" class="form-control" id="' + uuid + '-recipient" value="' + sensuEvent.email + '">';
  } else {
    var recipient = '<label for="recipient">Make Sure Recipient is a valid email for: <br/>No Company Specified</label>' +
      '<input type="email" class="form-control" id="' + uuid + '_recipient" value="monitor@contegix.com">';
  }


  var html = '<container><div class="row"><div class="col-md-7"><pre>' + prettyPrintOne(decodeURI(text)) + '</pre></div><div class="col-md-4"><div class="row">';
  html +=  '<form role="form" id="' + uuid + '-form">' +
    '<div class="form-group">' +
    '<fieldset><legend>Attach this event to a Ticket</legend>' +
    '<label for="ticketID">Enter an existing Ticket number:</label>' +
    '<input type="number" class="form-control" id="' + uuid + '-ticketID" placeholder="Enter a valid, existing, Ticket Number">' +
    '<label>Or:&nbsp;<input id="escalate-' + uuid + '" type="checkbox">&nbsp;Escalate to a NEW ticket</label>' +
    '</div></fieldset>' +
    '</div><div class="row"><fieldset><legend>Pass along any relevant documentation: </legend><div class="form-group">' +
    '<textarea class="form-control" type="text" id="documentation" name="documentation" rows="4""></textarea>' +
    '</fieldset>' +
    '<input type="hidden" value="' + uuid + '" id="uuid" name="uuid">' +
    '<input type="hidden" value="' + text + '" id="event" name="event">' +
    recipient +
    '<button type="submit" id="' + uuid + '-submit" class="btn btn-default">Submit Ticket</button>' +
    '</form>' +
    '<script type="text/javascript">$("#escalate-' + uuid + '").click(function() { $("#' + uuid + '-ticketID").attr("disabled", this.checked); }); $( "#' + uuid + '-form" ).submit(handleTicketForm)</script></div></div></div>';
  bootbox.alert({"message": html, buttons: { ok: { label: "Back", className: "btn-primary"}}, "className" : "wide-bootbox"});
};

function handleTicketForm(event) {
  event.preventDefault();

  var documentation = event.target[4].value;
  var ticketID = event.target[1].value;
  var newTicket = event.target[2].checked;
  var uuid = event.target[5].defaultValue;
  var eventJSON =  decodeURI(event.target[6].value);
  var recipient = event.target[7].value;

  try {
    var sensuEvent = JSON.parse(eventJSON);
  } catch (e) {
    console.log('failed to parse event JSON');
    return false;
  }

  $("#" + uuid + "-submit").attr('disabled','disabled');

  var url = '/api/v1/ubersmith/tickets/';

  if (newTicket) {
    var data = {subject: 'Monitoring System Escalated Event', sensuEvent: encodeURI(JSON.stringify(sensuEvent)), documentation: documentation, recipient: recipient, priority: sensuEvent.status, client_id: sensuEvent.clientid, device_id: sensuEvent.dev};
    url += 'ticket';
  } else {
    var data = {ticketID: ticketID, subject: 'Monitoring System Escalated Event', sensuEvent: encodeURI(JSON.stringify(sensuEvent)), documentation: documentation, visible: 1, time_spent: 1};
    url += 'ticketid/' + ticketID + '/posts';
  }

  $.ajax({
    url: url,
    type: 'post',
    dataType: 'json',
    data: data,
    success: function(data) {
      var response = JSON.parse(data);
      if (response.status == true)
      {
        bootbox.alert({"message": 'Completed!', "className" : "small-bootbox"});
        submitSilenceJSON(sensuEvent.client, sensuEvent.check);
      } else {
        bootbox.alert({"message": 'Failed to submit post: ' + response.error_message, "className" : "small-bootbox"});
        $("#" + uuid + "-submit").removeAttr('disabled')
      }
    }
  });
  event.preventDefault();
}

function syntaxHighlight(json) {
  if (typeof json != 'string') {
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
}
