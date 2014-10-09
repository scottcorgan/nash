var proto = require('../lib/proto');
var command = require('../lib/command');
var test = require('tape');

test('proto: defaults', function (t) {
  
  t.deepEqual(proto._commands, [], 'blank command collection');
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
  
  proto._commands = [];
  var handlerCalled = false;
  proto.command('test')
    .handler(function () {
      
      handlerCalled = true;
    });
  proto.run(['', '', 'test']);
  
  t.ok(handlerCalled, 'runs the command');
  
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

test('proto: runs beforeAlls');
test('proto: runs cli level flags');
test('proto: runs afterAlls');

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