var nash = require('../lib/index');
var command = require('../lib/command');
var commands = require('../lib/commands');
var flags = require('../lib/flags');
var flag = require('../lib/flag');
var wrappers = require('../lib/wrappers');
var test = require('tape');

test('cli: defaults', function (t) {
  
  var cli = nash();
  
  t.deepEqual(cli.internals.commands, commands(), 'blank command collection');
  t.deepEqual(cli.internals.flags, flags(), 'blank flag collection');
  t.deepEqual(cli.internals.beforeAlls, wrappers(), 'blank beforeAlls collection');
  t.deepEqual(cli.internals.afterAlls, wrappers(), 'blank afterAlls collection');
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
  
  t.deepEqual(cli.internals.commands.all(), [cmd], 'adds command to collection');
  t.deepEqual(cli.command('test', 't').name(), command('test', 't').name(), 'creates instance of command');
  t.equal(cli.command('test').description(), 'command description', 'return command if already defined');
  t.equal(cli.command('t').description(), 'command description', 'return command if already defined');
  t.end();
});

test('cli: flags', function (t) {
  
  var cli = nash();
  var flg = cli.flag('--test', '-t');
  
  flg.description('flag description');
  
  t.deepEqual(cli.internals.flags.all(), [flg], 'adds flag to collection');
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
  var commandFlagCalled = false;
  var callstack = [];
  
  cli.beforeAll(function (data, flags) {
    
    callstack.push('beforeAll');
  });
  cli.afterAll(function (data, flags) {
    
    callstack.push('afterAll');
  });
  cli.flag('-t')
    .handler(function () {
      
      callstack.push('flag');
    });
  cli.command('test')
    .handler(function () {
      
      callstack.push('command');
      handlerCalled = true;
    })
    .flag('-t')
      .handler(function () {
        
        commandFlagCalled = true;
      });
  cli.run(['', '', 'test', '-t']);
  
  t.ok(handlerCalled, 'runs the command');
  t.deepEqual(callstack, ['beforeAll', 'flag', 'command', 'afterAll'], 'execution order');
  t.ok(commandFlagCalled, 'calls cli and command flags if not overridden');
  
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
  var beforeAllRan1 = false;
  var beforeAllRan2 = false;
  var beforeAllRan3 = false;
  
  var chained = cli
    .beforeAll(function (data, flags) {
      
      beforeAllRan1 = true;
      
      t.deepEqual(this, cli, 'bound to cli object');
      t.deepEqual(data, ['data'], 'passed in data');
      t.deepEqual(flags, {t: 'flagged'}, 'passed in flags');
    })
    .beforeAll(
      function (data, flags) {
        
        beforeAllRan2 = true;
        
        t.deepEqual(data, ['data'], 'passed in data');
        t.deepEqual(flags, {t: 'flagged'}, 'passed in flags');
      },
      function (data, flags) {
        
        beforeAllRan3 = true;
        
        t.deepEqual(data, ['data'], 'passed in data');
        t.deepEqual(flags, {t: 'flagged'}, 'passed in flags');
      }
    );
  
  cli.runBeforeAlls(['data'], {t: 'flagged'}, function () {
    
    t.ok(beforeAllRan1, 'all methods ran');
    t.ok(beforeAllRan2, 'all methods ran');
    t.ok(beforeAllRan3, 'all methods ran');
    t.deepEqual(chained, cli, 'chainable');
    t.end();
  });
});

test('cli: runs afterAlls', function (t) {
  
  var cli = nash();
  var afterAllRan1 = false;
  var afterAllRan2 = false;
  var afterAllRan3 = false;
  
  var chained = cli
    .afterAll(function (data, flags) {
      
      afterAllRan1 = true;
      
      t.deepEqual(this, cli, 'bound to cli object');
      t.deepEqual(data, ['data'], 'passed in data');
      t.deepEqual(flags, {t: 'flagged'}, 'passed in flags');
    })
    .afterAll(
      function (data, flags) {
        
        afterAllRan2 = true;
        
        t.deepEqual(data, ['data'], 'passed in data');
        t.deepEqual(flags, {t: 'flagged'}, 'passed in flags');
      },
      function (data, flags) {
        
        afterAllRan3 = true;
        
        t.deepEqual(data, ['data'], 'passed in data');
        t.deepEqual(flags, {t: 'flagged'}, 'passed in flags');
      }
    );
  
  cli.runAfterAlls(['data'], {t: 'flagged'}, function () {
    
    t.ok(afterAllRan1, 'all methods ran');
    t.ok(afterAllRan2, 'all methods ran');
    t.ok(afterAllRan3, 'all methods ran');
    t.deepEqual(chained, cli, 'chainable');
    t.end();
  });
});

test('cli: finds a command', function (t) {
  
  var cli = nash();
  var cmd = cli.command('test');
  
  t.deepEqual(cli.findCommand('test'), cmd, 'by command name');
  
  // TODO: why do we need to find a command with a task name if
  // we have findCommandTask()?
  // 
  // t.notOk(cli.findCommand('test', 'task'), 'by command name with a task name');
  
  t.end();
});

test('cli: finds a command task', function (t) {
  
  var cli = nash();
  var task = cli.command('test').task('task');
  
  t.deepEqual(cli.findCommandTask('test', 'task'), task, 'by command name and command task name');
  t.notOk(cli.findCommandTask('test', 'notTask'), 'no task found');
  t.end();
});

test('cli: on invalid command', function (t) {
  
  var cli = nash();
  var commandCalled = false;
  
  var chain = cli.onInvalidCommand(function (commandName, data, flags) {
    
    commandCalled = true;  
    
    t.equal(commandName, 'noop', 'passes in command name');
    t.deepEqual(data, ['data'], 'passes in data');
    t.deepEqual(flags, {t: 'flagged'}, 'passes in flags');
  });
  
  cli.run(['', '', 'noop', 'data', '-t', 'flagged']);
  
  t.ok(commandCalled, 'ran');
  t.deepEqual(chain, cli, 'chainable');
  t.end();
});