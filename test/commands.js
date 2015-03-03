var test = require('tape');

var commands = require('../lib/commands');
var defineCommand = require('../lib/command');

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
  var cmds = commands().add(cmd);
  
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

test('commands: does not overwrite command when adding to collection', function (t) {
  
  var cmds = commands();
  var handler = function () {/* handler */};
  
  var cmd = defineCommand('test')
    .handler(handler);
    // .description('test description');
  
  var cmd2 = defineCommand('test', 't');
  
  cmds.add(cmd);
  cmds.add(cmd2);
  
  t.equal(cmds.all().length, 1, 'one uqique');
  t.equal(cmds.findByName('test').handler().toString(), handler.bind(cmd).toString(), 'same command handler');
  t.ok(cmds.findByName('t'), 'adds missing names when commands match');
  t.end();
});

test('commands: find command by name', function (t) {
  
  var cmd1 = defineCommand('test1', 't1', 'another');
  var cmd2 = defineCommand('test2', 't2');
  var cmds = commands().add(cmd1, cmd2);
  
  t.deepEqual(cmds.findByName('test1'), cmd1, 'by single name');
  t.deepEqual(cmds.findByName(['test1']), cmd1, 'by single name in array');
  
  // TODO: fix this test. If I change "t1" to "t1s", the test still passes
  // NOTE: this is probably an issue because when we find a command by name,
  // it doesn't check both names (_.intersection)
  t.deepEqual(cmds.findByName(['test1', 't1']), cmd1, 'by multiple names in array');
  
  t.deepEqual(cmds.findByName('test1', 't1'), cmd1, 'by multiple names as arguments');
  t.end();
});

test('commands: runs commands', function (t) {
  
  t.plan(5);
  
  var cmdRan = false;
  var ranFlag = false;
  var ranAsyncFlag = false;
  
  var cmd = defineCommand('test')
    .handler(function (data, flags, done) {
      
      t.equal(data[0], 'data', 'passed in data');
      t.ok(typeof done === 'function', 'passed in callback');
      
      cmdRan = true;
      done();
    });
  
  cmd.flag('-t')
    .handler(function (val, done) {
      
      ranFlag = true;
      done();
    });
  
  cmd.flag('-a')
    .handler(function (val, done) {
      
      ranAsyncFlag = true;
      done();
    });
    
  var cmds = commands(cmd);
  
  cmds.run({
    name:'test',
    data: ['data'],
    flags: {
      t: 't flag',
      a: true
    }
  }, function (err) {
    
    t.ok(ranFlag, 'ran flag');
    t.ok(ranAsyncFlag, 'ran async flag');
    t.ok(cmdRan, 'ran command');
  });
});