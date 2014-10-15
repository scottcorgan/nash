var nash = require('../lib/index');
var command = require('../lib/command');
var flag = require('../lib/flag');
var test = require('tape');

test('cli: defaults', function (t) {
  
  var cli = nash();
  
  t.deepEqual(cli.internals.commands, [], 'blank command collection');
  t.deepEqual(cli.internals.flags, [], 'blank flag collection');
  t.deepEqual(cli.internals.beforeAlls, [], 'blank beforeAlls collection');
  t.deepEqual(cli.internals.afterAlls, [], 'blank afterAlls collection');
  t.equal(typeof cli.internals.onInvalidCommand, 'function', 'default on invalid command function');
  t.end();
});

test('cli: instance options', function (t) {
  
  var options = {
    key1: 'value1',
    key2: 'value2'
  };
  var cli = nash(options);
  
  t.deepEqual(cli.options, options, 'adds options to instance');
  t.end();
});

test('cli: extends EventEmitter', function (t) {
  
  var EventEmitter = require('events').EventEmitter;
  var cli = nash();
  
  Object.keys(EventEmitter.prototype).forEach(function (key) {
    
    t.ok(cli[key], 'instance has EventEmitter value: ' + key);
  });
  t.end();
});

test('cli: command', function (t) {
  
  var cli = nash();
  var cmd = cli.command('test', 't');
  
  cmd.description('command description');
  
  t.deepEqual(cli.internals.commands, [cmd], 'adds command to collection');
  t.deepEqual(cli.command('test', 't').name(), command('test', 't').name(), 'creates instance of command');
  t.equal(cli.command('test').description(), 'command description', 'return command if already defined');
  t.equal(cli.command('t').description(), 'command description', 'return command if already defined');
  t.end();
});

test('cli: flags', function (t) {
  
  var cli = nash();
  var flg = cli.flag('--test', '-t');
  
  flg.description('flag description');
  
  t.deepEqual(cli.internals.flags, [flg], 'adds flag to collection');
  t.deepEqual(cli.flag('--test', '-t').name(), flag('--test', '-t').name(), 'creates instance of flag');
  t.equal(cli.flag('-t').description(), 'flag description', 'return flag if already defined');
  t.end();
});

test('cli: runs flags', function (t) {
  
  var cli = nash();
  var flagCalled1 = false;
  var flagCalled2 = false;
  var cliOverrideFlagCalled = false;
  var flagOverrideCalled = false;
  
  // Set up override flag
  var overrideFlag = flag('-o')
    .override()
    .handler(function () {
      
      flagOverrideCalled = true;
    });
  
  cli.flag('-f')
    .handler(function (val) {
      
      flagCalled1 = true;
      t.equal(val, 'test value1', 'passes value 1');
    });
  cli.flag('-t')
    .handler(function (val) {
      
      flagCalled2 = true;
      t.equal(val, 'test value2', 'passes value 2');
    });
  cli.flag('-o')
    .handler(function () {
      
      cliOverrideFlagCalled = true;
    });
  
  cli.runFlags({
    f: 'test value1',
    t: 'test value2', 
    o: true
  }, function (err) {
    
    t.ok(flagCalled1, 'ran flag 1 handler');
    t.ok(flagCalled2, 'ran flag 2 handler');
    t.notOk(cliOverrideFlagCalled, 'did not call cli flag');
    t.ok(flagOverrideCalled, 'called flag override');
    t.end();
  },
    // Flag override values
    [overrideFlag]
  );
  
});

test('cli: run method is chainable', function (t) {
  
  var cli = nash();
  
  t.deepEqual(cli.run(), cli, 'returns object');
  t.end();
});

test('cli: runs command', function (t) {
  
  var cli = nash();
  var handlerCalled = false;
  var callstack = [];
  
  cli.beforeAll(function (data, flags, next) {
    
    callstack.push('beforeAll');
    next();
  });
  cli.afterAll(function (data, flags, next) {
    
    callstack.push('afterAll');
    next();
  });
  cli.flag('-t')
    .handler(function () {
      
      callstack.push('flag');
    });
  cli.command('test')
    .handler(function () {
      
      callstack.push('command');
      handlerCalled = true;
    });
  cli.run(['', '', 'test', '-t']);
  
  t.ok(handlerCalled, 'runs the command');
  t.deepEqual(callstack, ['beforeAll', 'flag', 'command', 'afterAll'], 'execution order');
  
  callstack = [];
  handlerCalled = false;
  
  cli.command('test')
    .handler(function (data) {
      
      handlerCalled = true;
      t.equal(data, 'data', 'passes data to handler');
    });
  
  cli.run(['', '', 'test', 'data']);
  
  t.ok(handlerCalled, 'runs the command with data');
  t.end();
});

test('cli: command level flags can override cli level flags', function (t) {
  
  var cli = nash();
  var cliFlagCalled = false;
  var commandFlagCalled = false;
  var commandFlagCallCount = 0;
  
  cli.flag('-t')
    .handler(function () {
      
      cliFlagCalled = true;
    });
    
  cli.command('test')
    .flag('-t')
      .override()
      .handler(function () {
        
        commandFlagCallCount += 1;
        commandFlagCalled = true;
      });
  
  cli.run(['', '', 'test', '-t']);
  
  t.ok(commandFlagCalled, 'command flag');
  t.notOk(cliFlagCalled, 'cli flag');
  t.equal(commandFlagCallCount, 1, 'flag only called once');
  t.end();
});

test('cli: task level flags can override cli level flags', function (t) {
  
  var cli = nash();
  var cliFlagCalled = false;
  var taskFlagCalled = false;
  var taskFlagCallCount = 0;
  
  cli.flag('-t')
    .handler(function () {
      
      cliFlagCalled = true;
    });
    
  cli.command('test')
    .task('task')
      .flag('-t')
        .override()
        .handler(function () {
          
          taskFlagCallCount += 1;
          taskFlagCalled = true;
        });
  
  cli.run(['', '', 'test:task', '-t']);
  
  t.ok(taskFlagCalled, 'command flag');
  t.notOk(cliFlagCalled, 'cli flag');
  t.equal(taskFlagCallCount, 1, 'flag only called once');
  t.end();
});

test('cli: sets argv on cli level', function (t) {
  
  var cli = nash();
  cli.run(['', '', 'command', '-f', 'value']);
  
  t.deepEqual(cli.argv, { _: [ 'command' ], f: 'value' }, 'argv set on proto');
  t.end();
});

test('cli: runs command task', function (t) {
  
  var cli = nash();
  var taskRan = false;
  cli.command('test')
    .task('task')
    .handler(function (data) {
      
      t.equal(data, 'data', 'passes data to task handler');
      taskRan = true;
    });
  
  cli.run(['', '', 'test:task', 'data']);
  
  t.ok(taskRan, 'ran the task');
  t.end();
});

test('cli: runs beforeAlls', function (t) {
  
  var cli = nash();
  var beforeAllRan = false;
  
  var chained = cli.beforeAll(function (data, flags, next) {
    
    beforeAllRan = true;
    
    t.deepEqual(data, ['data'], 'passed in data');
    t.deepEqual(flags, {t: 'flagged'}, 'passed in flags');
    
    next();
  });
  
  cli.runBeforeAlls(['data'], {t: 'flagged'}, function () {
    
    t.ok(beforeAllRan, 'all methods ran');
    t.deepEqual(chained, cli, 'chainable');
    t.end();
  });
});

test('cli: runs afterAlls', function (t) {
  
  var cli = nash();
  var afterAllRan = false;
  
  var chained = cli.afterAll(function (data, flags, next) {
    
    afterAllRan = true;
    
    t.deepEqual(data, ['data'], 'passed in data');
    t.deepEqual(flags, {t: 'flagged'}, 'passed in flags');
    
    next();
  });
  
  cli.runAfterAlls(['data'], {t: 'flagged'}, function () {
    
    t.ok(afterAllRan, 'all methods ran');
    t.deepEqual(chained, cli, 'chainable');
    t.end();
  });
});

test('cli: finds a command', function (t) {
  
  var cli = nash();
  var cmd = cli.command('test');
  
  t.deepEqual(cli.findCommand('test'), cmd, 'by command name');
  t.notOk(cli.findCommand('test', 'task'), 'by command name with a task name');
  t.end();
});

test('cli: finds a command task', function (t) {
  
  var cli = nash();
  var task = cli.command('test').task('task');
  
  t.deepEqual(cli.findCommandTask('test', 'task'), task, 'by command name and command task name');
  t.notOk(cli.findCommand('test', 'notTask'), 'no task found');
  t.end();
});

test('cli: on invalid command', function (t) {
  
  var cli = nash();
  var commandCalled = false;
  
  var chain = cli.onInvalidCommand(function (commandName, data, flags, next) {
    
    commandCalled = true;  
    
    t.equal(commandName, 'noop', 'passes in command name');
    t.deepEqual(data, ['data'], 'passes in data');
    t.deepEqual(flags, {t: 'flagged'}, 'passes in flags');
    
    next();
  });
  
  cli.run(['', '', 'noop', 'data', '-t', 'flagged']);
  
  t.ok(commandCalled, 'ran');
  t.deepEqual(chain, cli, 'chainable');
  t.end();
});