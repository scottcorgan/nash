var proto = require('../lib/proto');
var command = require('../lib/command');
var test = require('tape');

test('proto: defaults', function (t) {
  
  t.deepEqual(proto._commands, [], 'blank command collection');
  t.deepEqual(proto._beforeAlls, [], 'blank beforeAlls collection');
  t.deepEqual(proto._afterAlls, [], 'blank afterAlls collection');
  t.equal(typeof proto._onInvalidCommand, 'function', 'default on invalid command function');
  t.end();
});

test('proto: command', function (t) {
  
  proto._commands = [];
  var cmd = proto.command('test');
  
  t.deepEqual(proto._commands, [cmd], 'adds command to collection');
  t.deepEqual(proto.command('test', 't').name(), command(['test', 't']).name(), 'creates instance of command');
  t.end();
});

test('proto: run method is chainable', function (t) {
  
  proto._commands = [];
  t.deepEqual(proto.run(), proto, 'returns object');
  t.end();
});

test('proto: runs command', function (t) {
  
  // TODO: test the run callstack
  var handlerCalled = false;
  var callstack = [];
  
  proto._commands = [];
  
  proto.beforeAll(function (data, flags, next) {
    
    callstack.push('beforeAll');
    next();
  });
  proto.afterAll(function (data, flags, next) {
    
    callstack.push('afterAll');
    next();
  });
  proto.command('test')
    .handler(function () {
      
      callstack.push('command');
      handlerCalled = true;
    });
  proto.run(['', '', 'test']);
  
  t.ok(handlerCalled, 'runs the command');
  t.deepEqual(callstack, ['beforeAll', 'command', 'afterAll'], 'execution order');
  
  callstack = [];
  proto._commands = [];
  handlerCalled = false;
  proto.command('test')
    .handler(function (data) {
      
      handlerCalled = true;
      t.equal(data, 'data', 'passes data to handler');
    });
  
  proto.run(['', '', 'test', 'data']);
  
  t.ok(handlerCalled, 'runs the command with data');
  t.end();
});

test('proto: sets argv on cli level', function (t) {
  
  proto.run(['', '', 'command', '-f', 'value']);
  
  t.deepEqual(proto.argv, { _: [ 'command' ], f: 'value' }, 'argv set on proto');
  t.end();
});

test('proto: runs command task', function (t) {
  
  proto._commands = [];
  var taskRan = false;
  proto.command('test')
    .task('task')
    .handler(function (data) {
      
      t.equal(data, 'data', 'passes data to task handler');
      taskRan = true;
    });
  
  proto.run(['', '', 'test:task', 'data']);
  
  t.ok(taskRan, 'ran the task');
  t.end();
});

test('proto: runs beforeAlls', function (t) {
  
  var beforeAllRan = false;
  
  proto._beforeAlls = [];
  var chained = proto.beforeAll(function (data, flags, next) {
    
    beforeAllRan = true;
    
    t.deepEqual(data, ['data'], 'passed in data');
    t.deepEqual(flags, {t: 'flagged'}, 'passed in flags');
    
    next();
  });
  
  proto.runBeforeAlls(['data'], {t: 'flagged'}, function () {
    
    t.ok(beforeAllRan, 'all methods ran');
    t.deepEqual(chained, proto, 'chainable');
    t.end();
  });
});

test('proto: runs afterAlls', function (t) {
  
  var afterAllRan = false;
  
  proto._afterAlls = [];
  var chained = proto.afterAll(function (data, flags, next) {
    
    afterAllRan = true;
    
    t.deepEqual(data, ['data'], 'passed in data');
    t.deepEqual(flags, {t: 'flagged'}, 'passed in flags');
    
    next();
  });
  
  proto.runAfterAlls(['data'], {t: 'flagged'}, function () {
    
    t.ok(afterAllRan, 'all methods ran');
    t.deepEqual(chained, proto, 'chainable');
    t.end();
  });
});

test('proto: runs cli level flags');

test('proto: finds a command', function (t) {
  
  proto._commands = [];
  var cmd = proto.command('test');
  
  t.deepEqual(proto.findCommand('test'), cmd, 'by command name');
  t.notOk(proto.findCommand('test', 'task'), 'by command name with a task name');
  t.end();
});

test('proto: finds a command task', function (t) {
  
  proto._commands = [];
  var task = proto.command('test').task('task');
  
  t.deepEqual(proto.findCommandTask('test', 'task'), task, 'by command name and command task name');
  t.notOk(proto.findCommand('test', 'notTask'), 'no task found');
  t.end();
});

test('proto: on invalid command', function (t) {
  
  var commandCalled = false;
  
  proto._commands = [];
  proto._beforeAlls = [];
  proto._afterAlls = [];
  
  var chain = proto.onInvalidCommand(function (commandName, data, flags, next) {
    
    commandCalled = true;  
    
    t.equal(commandName, 'noop', 'passes in command name');
    t.deepEqual(data, ['data'], 'passes in data');
    t.deepEqual(flags, {t: 'flagged'}, 'passes in flags');
    
    next();
  });
  
  proto.run(['', '', 'noop', 'data', '-t', 'flagged']);
  
  t.ok(commandCalled, 'ran');
  t.deepEqual(chain, proto, 'chainable');
  t.end();
});