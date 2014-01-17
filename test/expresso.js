exports['test express'] = function(){

assert.response(server, {
    url: '/', timeout: 500
}, {
    body: 'foobar'
});

assert.response(server, {
    url: '/',
    method: 'GET'
}, {
    body: '{"name":"tj"}',
    status: 200,
    headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'X-Foo': 'bar'
    }
});

assert.response(server, {
    url: '/foo',
    method: 'POST',
    data: 'bar baz'
}, {
    body: '/foo bar baz',
    status: 200
}, 'Test POST');

assert.response(server, {
    url: '/foo',
    method: 'POST',
    data: 'bar baz'
}, {
    body: '/foo bar baz',
    status: 200
}, function(res){
    // All done, do some more tests if needed
});

assert.response(server, {
    url: '/'
}, function(res){
    assert.ok(res.body.indexOf('tj') >= 0, 'Test assert.response() callback');
});
}
