var test = require('tape');

var flag = require('../lib/flag');

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

test('flag: getters and setters', function (t) {
  
  var flg = flag('-f')
    .description('description')
    .usage('usage')
    .hidden(true)
    .override(true)
    .async()
    .exit();
  
  t.deepEqual(flg.name(), ['-f'], 'name');
  t.equal(flg.isHidden(), true, 'hidden');
  t.equal(flg.shouldExit(), true, 'hidden');
  t.equal(flg.description(), 'description', 'description');
  t.equal(flg.usage(), 'usage', 'usage');
  t.equal(flg.isAsync(), true, 'async');
  t.equal(flg.shouldOverride(), true, 'override');
  t.end();
});

test('flag: matches flag name', function (t) {
  
  var flg = flag('--test', '-t');
  
  t.ok(flg.matchesName('--test'), 'matches single name');
  t.ok(flg.matchesName('-t'), 'matches other names');
  t.ok(flg.matchesName(['-t']), 'accepts and array of names');
  t.end();
});

test('flag: running the flag', function (t) {
  
  var flagCalled = false;
  var flagCallCount = 0;
  var flg = flag('-t')
    .handler(function (data) {
      
      flagCalled = true;
      flagCallCount += 1;
      
      t.equal(data, 'data', 'flag value');
    });
  
  flg.run('data');
  flg.runOnce('data');
  
  t.ok(flagCalled, 'ran flag');
  t.equal(flagCallCount, 1, 'called only once when using runOnce()');
  t.ok(flg.internals.ran, 'flag ran set to true');
  t.end();
});

test('flag: runs flag in async mode', function (t) {
  
  var flg = flag('-t')
    .async()
    .handler(function (val, done) {
      
      t.equal(val, 'val', 'passed in value');
      done();
    });
  
  flg.run('val', function () {
    
    t.ok(flg.internals.ran, 'flag ran set to true');
    t.end();
  });
});

test('flag: exits process on complete', function (t) {
  
  var exitedProcess = false;
  var flg = flag('-t');
  
  flg._exitProcess = function () {
    
    exitedProcess = true;
  };
  
  flg
    .exit()
    .run();
  
  t.ok(exitedProcess, 'exited process');
  t.end();
});