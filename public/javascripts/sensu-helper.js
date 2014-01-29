silenceCheck = function( client, check ) {
  var api_uri = '/api/v1/sensu/silence/';
  var call_uri;
  if (check != false) {
    call_uri = api_uri + 'check/' + encodeURI(client) + '/' + encodeURI(check);
  } else {
    call_uri = api_uri + 'client/' +  encodeURI(client)
  }
  var req = new XMLHttpRequest();
  req.open('get', call_uri);
}
