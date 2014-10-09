var nash = require('../lib');
var test = require('tape');

test('nash: instance options', function (t) {
  
  var options = {
    key1: 'value1',
    key2: 'value2'
  };
  var cli = nash(options);
  
  t.deepEqual(cli.options, options, 'adds options to instance');
  
  t.end();
});

test('nash: extends EventEmitter', function (t) {
  
  var EventEmitter = require('events').EventEmitter;
  var cli = nash();
  
  Object.keys(EventEmitter.prototype).forEach(function (key) {
    
    t.ok(cli[key], 'instance has EventEmitter value: ' + key);
  });
  t.end();
});

test('nash: extends proto', function (t) {
  
  var proto = require('../lib/proto');
  var cli = nash();
  
  Object.keys(proto).forEach(function (key) {
    
    t.ok(cli[key], 'extends proto value: ' + key);
  });
  
  t.end();
});