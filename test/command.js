var command = require('../lib/command');
var test = require('tape');

test('command: extends EventEmitter', function (t) {
  
  var EventEmitter = require('events').EventEmitter;
  var cmd = command('test');
  
  Object.keys(EventEmitter.prototype).forEach(function (key) {
    
    t.ok(cmd[key], 'instance has EventEmitter value: ' + key);
  });
  t.end();
});

test('command: noop', function (t) {
  
  t.doesNotThrow(function () {
    command.noop()
  }, undefined, 'defined function');
  t.deepEqual(typeof command.noop(), 'object', 'blank command');
  
  t.end();
});

test('command: handler', function (t) {
  
  var handlerCalled = false;
  var cmd = command('test')
    .handler(function () {
      handlerCalled = true;
    });
  
  cmd.handler()();
  
  t.equal(typeof cmd.handler(), 'function', 'gets function');
  t.ok(handlerCalled, 'sets the function');
  t.end();
});

test('command: task', function (t) {
  
  var cmd = command('test');
  var task = cmd.task('task');
  
  task.usage('usage1');
  
  t.deepEqual(cmd.internals.tasks.all(), [task], 'sets up task in collection');
  t.equal(cmd.task('task').usage(), 'usage1', 'return task if already defined');
  t.equal(task.task, undefined, 'does not allow tasks to create tasks on itself');
  t.end();
});

test('command: flag', function (t) {
  
  var cmd = command('test');
  var flg = cmd.flag('--test');
  
  flg.description('flag description');
  
  t.deepEqual(cmd.internals.flags.all(), [flg], 'sets up flag in collection');
  t.equal(cmd.flag('--test').description(), 'flag description', 'return flag if already defined');
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
    .description('description')
    .usage('usage')
    .hidden()
    .before(function () {})
    .after(function () {});
  
  t.deepEqual(cmd.name(), ['test'], 'name');
  t.equal(cmd.isHidden(), true, 'hidden');
  t.equal(cmd.description(), 'description', 'description');
  t.equal(cmd.usage(), 'usage', 'usage');
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
  
  cmd.before(function (data, flags, next) {
    
    beforeCalled = true;
    
    t.deepEqual(data, ['data'], 'passes in data');
    t.deepEqual(flags, {f: true}, 'passes in flags');
    next();
  });
  
  cmd.runBefores(['data'], {f: true}, function () {
    
    t.ok(beforeCalled, 'executed in series');
    t.end();
  });
  
});

test('command: runs afters', function (t) {
  
  var cmd = command('test');
  var afterCalled = false;
  
  cmd.after(function (data, flags, next) {
    
    afterCalled = true;
    
    t.deepEqual(data, ['data'], 'passes in data');
    t.deepEqual(flags, {f: true}, 'passes in flags');
    
    next();
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
    .handler(function (val) {
      
      flag1CallCount += 1;
      flagCalled1 = true;
      t.equal(val, 'test value1', 'passes value 1');
    });
  cmd.flag('-t')
    .handler(function (val) {
      
      flag2CallCount += 1;
      flagCalled2 = true;
      t.equal(val, 'test value2', 'passes value 2');
    });
  
  cmd.runFlags({
    f: 'test value1',
    t: 'test value2'
  });
  
  t.ok(flagCalled1, 'ran flag 1 handler');
  t.ok(flagCalled2, 'ran flag 2 handler');
    
  cmd.runFlags({
    f: 'test value1',
    t: 'test value2'
  });
  
  t.equal(flag1CallCount, 1, 'flag 1 called only once');
  t.equal(flag2CallCount, 1, 'flag 1 called only once');
  t.end();
});

test('command: running the command', function (t) {
  
  var cmd = command('test');
  var callstack = [];
  
  cmd.before(function (data, flags, next) {
    callstack.push('before');
    next();
  });
  
  cmd.flag('-f')
    .handler(function () {
      callstack.push('flag');
    });
  
  cmd.handler(function () {
    callstack.push('handler');
  });
  
  cmd.after(function (data, flags, next) {
    callstack.push('after');
    next();
  });
  
  cmd.run([], {
    f: true
  }, function () {
    
    t.deepEqual(callstack, ['before', 'flag', 'handler', 'after'], 'ran command decorators in order');
    t.end();
  });
});

test('command: deprecated command exits by default', function (t) {
  
  t.plan(6);
  
  var handlerCalled = false;
  var flagCalled = false;
  var beforeCalled = false;
  var afterCalled = false;
  var cmd = command('test')
    .deprecate('test has been deprecated')
    .handler(function () {
      
      handlerCalled = true;
    })
    .before(function (data, flags, done) {
      
      beforeCalled = true;
      done();
    })
    .after(function (data, flags, done) {
      
      afterCalled = true;
      done();
    });
  
  cmd.flag('-t')
    .handler(function () {
      flagCalled = true;
    });
  
  cmd.on('warning', function (msg) {
    
    t.equal(msg, 'test has been deprecated', 'warning message');
  });
  
  cmd.run({}, {t: true}, function () {
    
    t.ok(cmd.isDeprecated(), 'deprecated getter');
    t.notOk(handlerCalled, 'handler not called');
    t.notOk(flagCalled, 'flag not called');
    t.notOk(beforeCalled, 'before not called')
    t.notOk(afterCalled, 'after not called')
  });
});

test('command: deprecated command does not exit with options', function (t) {
  
  t.plan(2);
  
  var handlerCalled = false;
  var cmd = command('test')
    .deprecate('test has been deprecated', {
      exit: false
    })
    .handler(function () {
      
      handlerCalled = true;
    });
  
  cmd.on('warning', function (msg) {
    
    t.equal(msg, 'test has been deprecated');
  });
  
  cmd.run();
  
  t.ok(handlerCalled, 'handler called');
});

test('command: deprecatedShouldExit()', function (t) {
  
  var cmd1 = command('test').deprecate('deprecated');
  var cmd2 = command('test').deprecate('deprecated', {
    exit: false
  });
  
  t.ok(cmd1.deprecatedShouldExit(), '(default) should exit');
  t.notOk(cmd2.deprecatedShouldExit(), 'should not exit');
  t.end();
});


