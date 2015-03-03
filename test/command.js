var test = require('tape');

var command = require('../lib/command');

test('command: extends EventEmitter', function (t) {
  
  var EventEmitter = require('events').EventEmitter;
  var cmd = command('test');
  
  t.ok(cmd.emit, 'emit');
  t.ok(cmd.addListener, 'addListener');
  t.ok(cmd.on, 'on');
  t.ok(cmd.once, 'once');
  t.ok(cmd.removeListener, 'removeListener');
  t.ok(cmd.removeAllListeners, 'removeAllListeners');
  t.ok(cmd.listeners, 'listeners');
  
  t.end();
});

test('command: noop', function (t) {
  
  t.doesNotThrow(function () {
    command.noop();
  }, undefined, 'defined function');
  t.deepEqual(typeof command.noop(), 'object', 'blank command');
  
  t.end();
});

test('command: handler', function (t) {
  
  var handlerCalled = false;
  var cmd = command('test')
    .handler(function (data, flags, done) {
      
      handlerCalled = true;
      done();
    });
  
  cmd.handler()([], {}, function () {
    
    t.equal(typeof cmd.handler(), 'function', 'gets function');
    t.ok(handlerCalled, 'sets the function');
    t.end();
  });
  
});

test('command: task', function (t) {
  
  var cmd = command('test');
  var task = cmd.task('task');
  var handler = function () {/* handler */};
  
  task.handler(handler);
  
  t.deepEqual(cmd.internals.tasks.all(), [task], 'sets up task in collection');
  t.equal(cmd.task('task').handler().toString(), handler.bind(task).toString(), 'return task if already defined');
  t.equal(task.task, undefined, 'does not allow tasks to create tasks on itself');
  t.end();
});

test('command: flag', function (t) {
  
  var cmd = command('test');
  var flg = cmd.flag('--test');
  var handler = function () {/* handler */};
  
  flg.handler(handler);
  
  t.deepEqual(cmd.internals.flags.all(), [flg], 'sets up flag in collection');
  t.equal(cmd.flag('--test').handler().toString(), handler.bind(cmd).toString(), 'return flag if already defined');
  t.end();
});

test('command: find a task', function (t) {
  
  var cmd = command('test');
  
  t.notOk(cmd.findTask('task'), 'undefined when no tasks found');
  
  var tsk = cmd.task('task', 't');
  
  t.deepEqual(cmd.findTask('task'), tsk, 'by name');
  t.deepEqual(cmd.findTask('task', 't'), tsk, 'by multiple names');
  t.end();
});

test('command: find a flag', function (t) {
  
  var cmd = command('test');
  
  t.notOk(cmd.findFlag('-t'), 'undefined when no flags found');
  
  var flg = cmd.flag('--test', '-t');
  
  t.deepEqual(cmd.findFlag('--test'), flg, 'by name');
  t.deepEqual(cmd.findFlag('--test', '-t'), flg, 'by multiple names');
  t.end();
});

test('command: getters and setters', function (t) {
  
  var cmd = command('test')
    .before(function () {})
    .after(function () {});
  
  t.deepEqual(cmd.name(), ['test'], 'name');
  t.equal(cmd.before().length, 1, 'before');
  t.equal(cmd.after().length, 1, 'after');
  t.end();
});

test('command: matches command name', function (t) {
  
  var cmd = command('test', 't');
  
  t.ok(cmd.matchesName('test'), 'matches single name');
  t.ok(cmd.matchesName('t'), 'matches other names');
  t.end();
});

test('command: matches command task name', function (t) {
  
  var cmd = command('test', 't');
  var tsk = cmd.task('task', 'sk');
  
  t.deepEqual(cmd.matchesTask('test', 'task'), tsk, 'finds task by command and command task name');
  t.deepEqual(cmd.matchesTask('t', 'task'), tsk, 'finds task by any command and command task name');
  t.deepEqual(cmd.matchesTask('test', 'sk'), tsk, 'finds task by command and any command task name');
  t.end();
});

test('command: runs befores', function (t) {
  
  var cmd = command('test');
  var beforeCalled = false;
  
  cmd.before(function (data, flags, done) {
    
    beforeCalled = true;
    
    t.deepEqual(data, ['data'], 'passes in data');
    t.deepEqual(flags, {f: true}, 'passes in flags');
    
    done();
  });
  
  cmd.runBefores(['data'], {f: true}, function () {
    
    t.ok(beforeCalled, 'executed in series');
    t.end();
  });
});

test('command: runs afters', function (t) {
  
  var cmd = command('test');
  var afterCalled = false;
  
  cmd.after(function (data, flags, done) {
    
    afterCalled = true;
    
    t.deepEqual(data, ['data'], 'passes in data');
    t.deepEqual(flags, {f: true}, 'passes in flags');
    
    done();
  });
  
  cmd.runAfters(['data'], {f: true}, function () {
    
    t.ok(afterCalled, 'executed in series');
    t.end();
  });
});

test('command: runs flags', function (t) {
  
  var cmd = command('test');
  var flagCalled1 = false;
  var flagCalled2 = false;
  var flag1CallCount = 0;
  var flag2CallCount = 0;
  
  cmd.flag('-f')
    .handler(function (val, done) {
      
      flag1CallCount += 1;
      flagCalled1 = true;
      t.equal(val, 'test value1', 'passes value 1');
      
      done();
    });
    
  cmd.flag('-t')
    .handler(function (val, done) {
      
      flag2CallCount += 1;
      flagCalled2 = true;
      t.equal(val, 'test value2', 'passes value 2');
      
      done();
    });
  
  cmd.runFlags({
    f: 'test value1',
    t: 'test value2'
  }, function () {
    
    t.ok(flagCalled1, 'ran flag 1 handler');
    t.ok(flagCalled2, 'ran flag 2 handler');
    
    cmd.runFlags({
      f: 'test value1',
      t: 'test value2'
    }, function () {
      
      t.equal(flag1CallCount, 1, 'flag 1 called only once');
      t.equal(flag2CallCount, 1, 'flag 1 called only once');
      t.end();
    });
  });
});

test('command: running the command', function (t) {
  
  var cmd = command('test');
  var callstack = [];
  
  cmd.before(function (data, flags, done) {
    
    callstack.push('before');
    done();
  });
  
  cmd.flag('-f')
    .handler(function (val, done) {
      
      callstack.push('flag');
      done();
    });
  
  cmd.handler(function (data, flags, done) {
    
    callstack.push('handler');
    done();
  });
  
  cmd.after(function (data, flags, done) {
    
    callstack.push('after');
    done();
  });
  
  cmd.run([], {
    f: true
  }, function () {
    
    t.deepEqual(callstack, ['before', 'flag', 'handler', 'after'], 'ran command decorators in order');
    t.end();
  });
});

test('command: run command', function (t) {
  
  var handlerCalled = false;
  var cmd = command('test')
    // .handler(function (data1, data2, done) {
    .handler(function (data, flags, done) {
      
      handlerCalled = true;
      
      t.deepEqual(data[0], 'data1', 'passed in data1 to command handler');
      t.deepEqual(data[1], 'data2', 'passed in data2 to command handler');
      t.deepEqual(flags, {t: 'val'}, 'passed in flag map');
      t.ok(typeof done, 'function', 'passed in callback to command handler');
      done();
    });
  
  cmd.before(function (data, flags, done) {
    
    t.deepEqual(data, ['data1', 'data2'], 'passed in data to before');
    t.ok(typeof done, 'function', 'passed in callback to before');
    done();
  });
  
  cmd.flag('-t')
    .handler(function (val, done) {
      
      t.equal(val, 'val', 'passed val into flag handler');
      t.ok(typeof done, 'function', 'passed in callback to flag handler');
      done();
    });
  
  cmd.after(function (data, flags, done) {
    
    t.deepEqual(data, ['data1', 'data2'], 'passed in data to after');
    t.ok(typeof done, 'function', 'passed in callback to after');
    done();
  });
  
  cmd.run(['data1', 'data2'], {t: 'val'}, function (err) {
    
    t.ok(handlerCalled, 'handler called');
    t.end();
  });
});

test('command: finishes running command with no handler', function (t) {
  
  var beforeCalled = false;
  var cmd = command('test')
    .before(function (data, flags, done) {
      
      beforeCalled = true;
      done();
    });
  
  // Async mode
  cmd.run([], {}, function () {
    
    t.ok(beforeCalled, 'called before');
    t.end();
  });
});