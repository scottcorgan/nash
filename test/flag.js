var flag = require('../lib/flag');
var test = require('tape');

test('flag: extends EventEmitter', function (t) {
  
  var EventEmitter = require('events').EventEmitter;
  var flg = flag('-t');
  
  Object.keys(EventEmitter.prototype).forEach(function (key) {
    
    t.ok(flg[key], 'instance has EventEmitter value: ' + key);
  });
  t.end();
});

test('flag: handler', function (t) {
  
  var handlerCalled = false;
  var flg = flag('test')
    .handler(function () {
      
      handlerCalled = true;
    });
  
  flg.handler()();
  
  t.equal(typeof flg.handler(), 'function', 'gets function');
  t.ok(handlerCalled, 'sets the function');
  t.end();
});

test('flag: setting values', function (t) {
  
  var flg = flag('-f')
    .description('description')
    .usage('usage')
    .hidden(true)
    .exit();
  
  t.deepEqual(flg.name(), ['-f'], 'name');
  t.equal(flg.isHidden(), true, 'hidden');
  t.equal(flg.shouldExit(), true, 'hidden');
  t.equal(flg.description(), 'description', 'description');
  t.equal(flg.usage(), 'usage', 'usage');
  t.end();
});

test('flag: matches flag name', function (t) {
  
  var flg = flag('--test', '-t');
  
  t.ok(flg.matchesName('--test'), 'matches single name');
  t.ok(flg.matchesName('-t'), 'matches other names');
  t.end();
});

test('flag: running the flag', function (t) {
  
  var flagCalled = false;
  var flg = flag('-t')
    .handler(function (data) {
      
      flagCalled = true
      
      t.equal(data, 'data', 'flag value');
    });
  
  flg.run('data');
  
  t.ok(flagCalled, 'ran flag');
  t.end();
});

test('flag: exits process on complete', function (t) {
  
  var exitedProcess = false;
  var flg = flag('-t');
  
  flg._exitProcess = function () {
    
    exitedProcess = true;
  };
  
  flg.exit().run();
  
  t.ok(exitedProcess, 'exited process');
  t.end();
});