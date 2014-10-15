var commands = require('../lib/commands');
var defineCommand = require('../lib/command');
var test = require('tape');

test('commands: instance', function (t) {
  
  var cmds = commands();
  
  t.ok(cmds instanceof commands.Instance, 'instance of Commands');
  t.end();
});

test('commands: instantiates with list of commands', function (t) {
  
  var cmd = defineCommand('test');
  var cmd2 = defineCommand('test2');
  
  t.deepEqual(commands(cmd).all(), [cmd], 'with single command');
  t.deepEqual(commands([cmd]).all(), [cmd], 'with single command in array');
  t.deepEqual(commands([cmd, cmd2]).all(), [cmd, cmd2], 'with multiple commands in array');
  t.deepEqual(commands(cmd, cmd2).all(), [cmd, cmd2], 'with multiple commands as arguments');
  t.end();
});

test('commands: raw array of commands', function (t) {
  
  var cmd = defineCommand('test');
  var cmds = commands(cmd);
  
  t.deepEqual(cmds.all(), [cmd], 'list of commands');
  t.end();
});

test('commands: add command to collection', function (t) {
  
  var cmd = defineCommand('test');
  var cmd2 = defineCommand('test2');
  
  t.deepEqual(commands().add(cmd).all(), [cmd], 'added single command');
  t.deepEqual(commands().add([cmd]).all(), [cmd], 'added single command in array');
  t.deepEqual(commands().add([cmd, cmd2]).all(), [cmd, cmd2], 'added multiple commands in array');
  t.deepEqual(commands().add(cmd, cmd2).all(), [cmd, cmd2], 'added multiple commands as arguments');
  t.end();
});

test('commands: find command by name', function (t) {
  
  var cmd1 = defineCommand('test1', 't1', 'another');
  var cmd2 = defineCommand('test2', 't2');
  var cmds = commands(cmd1, cmd2);
  
  t.deepEqual(cmds.findByName('test1'), cmd1, 'by single name');
  t.deepEqual(cmds.findByName(['test1']), cmd1, 'by single name in array');
  t.deepEqual(cmds.findByName(['test1', 't1']), cmd1, 'by multiple names in array');
  t.deepEqual(cmds.findByName('test1', 't1'), cmd1, 'by multiple names as arguments');
  t.end();
});
