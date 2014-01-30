var socket = io.connect('http://localhost');

socket.emit("subscribe", { room: "global" });
socket.emit("subscribe", { room: "monitoring" });

socket.on('SYN', function (data, fn) {
  fn('ACK');
});

socket.on('ALERT', function (data, fn) {
  var data = JSON.parse(data);
  if (!data.severity)
  {
    data.severity = 'default';
  }

  if (!data.message || !data.uuid)
  {
    fn(JSON.stringify({status: 400, message: 'Bad Request: message and uuid are required parameters'}));
    return;
  }

  addAlert(data.message, data.uuid, data.severity);
  fn(JSON.stringify({status: 200, message: 'OK'}));
});

function addAlert(message, uuid, severity) {
  if (arguments.length == 2)
  {
    severity = 'default';
  }
  $('#alerts').append(
    '<div id="' + uuid + '" class="alert alert-' + severity + ' fade in">' +
      '<button type="button" class="close" data-dismiss="alert"><button type="button" value="Silence" data-dismiss="alert">' +
      '&times;</button>' + message + '</div>');
}