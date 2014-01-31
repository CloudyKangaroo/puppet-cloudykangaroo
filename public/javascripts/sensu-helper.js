var renderButton = function(client, check) {
 return "<button onclick=\"silenceCheck('"+client+"', '"+check+"');\" class=\"btn btn-default btn-xs btn-event\"><span class=\"glyphicon glyphicon-volume-off span-event active\"></span></button>"
}

var silenceCheck = function(client, check) {
  bootbox.prompt({ title: "Length of time to silence in hours (<= 72)", message: "Please enter a length of time to silence: in hours, less than 72 hours.", value: 8, callback: function(result) {
    if (result != null && parseInt(result) <= 72) {
      var api_uri = '/api/v1/sensu/silence/';
      var call_uri;
      if (check != 'false') {
       call_uri = api_uri + 'client/' + encodeURI(client) + '/check/' + encodeURI(check);
      } else {
        call_uri = api_uri + 'client/' +  encodeURI(client);
      }
      var params = "expires="+result*3600;
      var req = new XMLHttpRequest();
      req.open('post', call_uri, false);
      req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
      req.setRequestHeader("Content-length", params.length);
      req.setRequestHeader("Connection", "close");
      req.send(params);
      location.reload();
    } else {
      bootbox.confirm("Length of time to silence in hours must be an integer <= 72", function(result) {})
    }
  }})
}

var displayTextAlert = function(text)
{
  bootbox.alert('<pre>' + syntaxHighlight(decodeURI(text)) + '</pre>');
}

var displayEventDetails = function(text)
{
  //http://note19.com/2007/05/27/javascript-guid-generator/
  var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    });

  var html = '<container><div class="row"><div class="col-md-6"><pre>' + syntaxHighlight(decodeURI(text)) + '</pre></div><div class="col-md-4"><div class="row">';
  html +=  '<form role="form" id="' + uuid + '-form">' +
    '<div class="form-group">' +
    '<fieldset><legend>Attach this event to a Ticket</legend>' +
    '<label for="ticketID">Enter an existing Ticket number:</label>' +
    '<input type="email" class="form-control" id="' + uuid + '-ticketID" placeholder="Enter a valid, existing, Ticket Number">' +
    '<label>Or:&nbsp;<input id="escalate-' + uuid + '" type="checkbox">&nbsp;Escalate to a NEW ticket</label></div>' +
    '</fieldset>' +
    '</div><div class="row"><fieldset><legend>Pass along any relevant documentation: </legend><div class="form-group">' +
    '<textarea class="form-control" rows="3"></textarea>' +
    '<label for="exampleInputFile">File input</label>' +
    '<input type="file" disabled id="exampleInputFile">' +
    '<p class="help-block">File size limit 10MB.</p>' +
    '</fieldset>' +
    '<input type="hidden" value="' + uuid + '" id="uuid" name="uuid">' +
    '<button type="submit" class="btn btn-default">Submit Ticket</button>' +
    '</form>' +
    '<script type="text/javascript">$("#escalate-' + uuid + '").click(function() { $("#' + uuid + '-ticketID").attr("disabled", this.checked); }); $( "#' + uuid + '-form" ).submit(function( event ) { alert( "Handler for .submit() called." ); event.preventDefault(); })</script></div></div></div>';
  bootbox.alert({"message": html, "className" : "wide-bootbox"});
};

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
