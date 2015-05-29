var test = require('tape');

var nash = require('../lib/index');
var command = require('../lib/command');
var commands = require('../lib/commands');
var flags = require('../lib/flags');
var flag = require('../lib/flag');
var wrappers = require('../lib/wrappers');

test('cli: defaults', function (t) {

  var cli = nash();

  t.deepEqual(cli.internals.commands, commands(), 'blank command collection');
  t.deepEqual(cli.internals.flags, flags(), 'blank flag collection');
  t.deepEqual(cli.internals.beforeAlls, wrappers(), 'blank beforeAlls collection');
  t.deepEqual(cli.internals.afterAlls, wrappers(), 'blank afterAlls collection');
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

  t.ok(cli.emit, 'emit');
  t.ok(cli.addListener, 'addListener');
  t.ok(cli.on, 'on');
  t.ok(cli.once, 'once');
  t.ok(cli.removeListener, 'removeListener');
  t.ok(cli.removeAllListeners, 'removeAllListeners');
  t.ok(cli.listeners, 'listeners');

  t.end();
});

test('cli: command', function (t) {

  var cli = nash();
  var cmd = cli.command('test', 't');
  var handler = function () {/* handler */};

  cmd.handler(handler);

  t.deepEqual(cli.internals.commands.all(), [cmd], 'adds command to collection');
  t.deepEqual(cli.command('test', 't').name(), command('test', 't').name(), 'creates instance of command');
  t.equal(cli.command('test').handler().toString(), handler.bind(cmd).toString(), 'return command if already defined');
  t.end();
});

test('cli: flags', function (t) {

  var handler = function () {/* handler */};
  var cli = nash();
  var flg = cli.flag('--test', '-t');

  flg.handler(handler);

  t.deepEqual(cli.internals.flags.all(), [flg], 'adds flag to collection');
  t.deepEqual(cli.flag('--test', '-t').name(), flag('--test', '-t').name(), 'creates instance of flag');
  t.equal(cli.flag('-t').handler().toString(), handler.bind(flg).toString(), 'return flag if already defined');
  t.end();
});

test.skip('cli: flag default value', function (t) {

  var cli = nash();
  cli.flag('--default', '-d').default('default value');
  cli.flag('--another', '-a').default('another default value');


  cli.default()
    .handler(function (done) {

      t.equal(cli.argv.d, 'my value', 'default value');
      // t.equal(cli.argv.default, 'my value', 'default value');
      // t.equal(cli.argv.a, 'another default value', 'default value');
      // t.equal(cli.argv.another, 'another default value', 'default value');
      done();
    });


  cli.run(['', '', 'some', '-d', 'my value'], function () {

    t.end();
  });
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
    .handler(function (val, done) {

      flagOverrideCalled = true;
      done();
    });

  cli.flag('-f')
    .handler(function (val, done) {

      flagCalled1 = true;
      t.equal(val, 'test value1', 'passes value 1');
      done();
    });
  cli.flag('-t')
    .handler(function (val, done) {

      flagCalled2 = true;
      t.equal(val, 'test value2', 'passes value 2');
      done();
    });
  cli.flag('-o')
    .handler(function (val, done) {

      cliOverrideFlagCalled = true;
      done();
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

test('cli: runs a single flag', function (t) {

  t.plan(2);

  var cli = nash();
  var ranFlag = false;

  cli.flag('-t')
    .handler(function (data, done) {

      t.equal(data, 'data', 'passed data into flag');

      ranFlag = true;
      done();
    });

  cli.runFlag('t', 'data', function () {

    t.ok(ranFlag, 'ran flag');
  });
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

  cli.beforeAll(function (data, flags, done) {

    callstack.push('beforeAll');
    done();
  });
  cli.afterAll(function (data, flags, done) {

    callstack.push('afterAll');
    done();
  });
  cli.flag('-t')
    .handler(function (val, done) {

      callstack.push('flag');
      done();
    });
  cli.command('test')
    .handler(function (data, flags, done) {

      callstack.push('command');
      handlerCalled = true;
      done();
    })
    .flag('-t')
      .handler(function (val, done) {

        commandFlagCalled = true;
        done();
      });
  cli.run(['', '', 'test', '-t'], function () {

    t.ok(handlerCalled, 'runs the command');
    t.deepEqual(callstack, ['beforeAll', 'flag', 'command', 'afterAll'], 'execution order');
    t.ok(commandFlagCalled, 'calls cli and command flags if not overridden');

    callstack = [];
    handlerCalled = false;

    cli.command('test')
      .handler(function (data, flags, done) {

        handlerCalled = true;
        t.equal(data[0], 'data', 'passes data to handler');
        done();
      });

    cli.run(['', '', 'test', 'data'], function () {

      t.ok(handlerCalled, 'runs the command with data');
      t.end();
    });
  });
});

test('cli: command level flags can override cli level flags', function (t) {

  var cli = nash();
  var cliFlagCalled = false;
  var commandFlagCalled = false;
  var commandFlagCallCount = 0;

  cli.flag('-t')
    .handler(function (val, done) {

      cliFlagCalled = true;
      done();
    });

  cli.command('test')
    .flag('-t')
      .override()
      .handler(function (val, done) {

        commandFlagCallCount += 1;
        commandFlagCalled = true;
        done();
      });

  cli.run(['', '', 'test', '-t'], function () {

    t.ok(commandFlagCalled, 'command flag');
    t.notOk(cliFlagCalled, 'cli flag');
    t.equal(commandFlagCallCount, 1, 'flag only called once');
    t.end();
  });
});

test('cli: task level flags can override cli level flags', function (t) {

  var cli = nash();
  var cliFlagCalled = false;
  var taskFlagCalled = false;
  var taskFlagCallCount = 0;

  cli.flag('-t')
    .handler(function (val, done) {

      cliFlagCalled = true;
      done();
    });

  cli.command('test')
    .task('task')
      .flag('-t')
        .override()
        .handler(function (val, done) {

          taskFlagCallCount += 1;
          taskFlagCalled = true;
          done();
        });

  cli.run(['', '', 'test:task', '-t'], function () {

    t.ok(taskFlagCalled, 'command flag');
    t.notOk(cliFlagCalled, 'cli flag');
    t.equal(taskFlagCallCount, 1, 'flag only called once');
    t.end();
  });
});

test('cli: sets argv on cli level', function (t) {

  var cli = nash();
  cli.run(['', '', 'command', '-f', 'value'], function () {

    t.deepEqual(cli.argv, { _: [ 'command' ], f: 'value' }, 'argv set on proto');
    t.end();
  });
});

test('cli: runs command task', function (t) {

  var cli = nash();
  var taskRan = false;
  cli.command('test')
    .task('task')
    .handler(function (data, flags, done) {

      t.equal(data[0], 'data', 'passes data to task handler');
      taskRan = true;
      done();
    });

  cli.run(['', '', 'test:task', 'data'], function () {

    t.ok(taskRan, 'ran the task');
    t.end();
  });
});

test('cli: runs beforeAlls', function (t) {

  var cli = nash();
  var beforeAllRan1 = false;
  var beforeAllRan2 = false;
  var beforeAllRan3 = false;

  var chained = cli
    .beforeAll(function (data, flags, done) {

      beforeAllRan1 = true;

      t.deepEqual(this, cli, 'bound to cli object');
      t.deepEqual(data, ['data'], 'passed in data');
      t.deepEqual(flags, {t: 'flagged'}, 'passed in flags');
      done();
    })
    .beforeAll(
      function (data, flags, done) {

        beforeAllRan2 = true;

        t.deepEqual(data, ['data'], 'passed in data');
        t.deepEqual(flags, {t: 'flagged'}, 'passed in flags');
        done();
      },
      function (data, flags, done) {

        beforeAllRan3 = true;

        t.deepEqual(data, ['data'], 'passed in data');
        t.deepEqual(flags, {t: 'flagged'}, 'passed in flags');
        done();
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
    .afterAll(function (data, flags, done) {

      afterAllRan1 = true;

      t.deepEqual(this, cli, 'bound to cli object');
      t.deepEqual(data, ['data'], 'passed in data');
      t.deepEqual(flags, {t: 'flagged'}, 'passed in flags');
      done();
    })
    .afterAll(
      function (data, flags, done) {

        afterAllRan2 = true;

        t.deepEqual(data, ['data'], 'passed in data');
        t.deepEqual(flags, {t: 'flagged'}, 'passed in flags');
        done();
      },
      function (data, flags, done) {

        afterAllRan3 = true;

        t.deepEqual(data, ['data'], 'passed in data');
        t.deepEqual(flags, {t: 'flagged'}, 'passed in flags');
        done();
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
  t.end();
});

test('cli: finds a command task', function (t) {

  var cli = nash();
  var task = cli.command('test').task('task');

  t.deepEqual(cli.findCommandTask('test', 'task'), task, 'by command name and command task name');
  t.notOk(cli.findCommandTask('test', 'notTask'), 'no task found');
  t.end();
});

test('cli: default command', function (t) {

  var cli = nash();
  var commandCalledCount = 0;

  cli.default()
    .handler(function (data, flags, done) {

      commandCalledCount += 1;
      done();
    });
  cli.run([], function () {

    t.equal(commandCalledCount, 1, 'command ran first time');

    var defaultCommand = cli.default();
    cli.run([], function () {

      t.equal(commandCalledCount, 2, 'ran same default command');

      t.end();
    });
  });
});

test('cli: one argument gets passed to default command', function (t) {

  t.plan(1);

  var cli = nash();

  cli.default()
    .handler(function (data, flags, done) {

      t.equal(data[0], 'arg1', 'argument 1 passed');
      done();
    });
  cli.run(['', '', 'arg1']);
});

test('cli: two arguments get passed to default command', function (t) {

  t.plan(2);

  var cli = nash();

  cli.default()
    .handler(function (data, flags, done) {

      t.equal(data[0], 'arg1', 'argument 1 passed');
      t.equal(data[1], 'arg2', 'argument 2 passed');
      done();
    });
  cli.run(['', '', 'arg1', 'arg2']);
});

test('cli: global flags work with default command', function (t) {

  t.plan(2);

  var cli = nash();
  var commandCalled = false;
  var flagCalled = false;

  cli.flag('--help', '-h')
    .handler(function (val, done) {

      flagCalled = true;
      done();
    });

  cli.default()
    .handler(function (data, flags, done) {

      commandCalled = true;
      done();
    });

  cli.run(['', '', '-h'], function () {

    t.ok(commandCalled, 'command ran');
    t.ok(flagCalled, 'flag ran');
  });
});

test('cli: decorates commands', function (t) {

  t.plan(3);

  var cli = nash();

  var chained = cli.decorate('command', 'test', function (val) {

    t.equal(val, 'value', 'passed value in to decorator');

    return this;
  });

  cli.decorate('command', 'another', function () {

    this._something = 'another';
  });

  t.deepEqual(chained, cli, 'chainable');

  var cmd = cli.command('testing');
  cmd.test('value');
  cmd.another();

  t.equal(cmd._something, 'another', 'can set data on the command');
});

test('cli: decorates flags', function (t) {

  t.plan(1);

  var cli = nash();

  cli.decorate('flag', 'test', function (val) {

    t.equal(val, 'data', 'passed data into decorator');
  });

  var flg = flag('-t');

  flg.test('data');
});

test('cli: register an array of plugins', function (t) {

  t.plan(3);

  var cli = nash();
  var commandCalled = false;
  var ranBeforeAll = false;

  var plugin1 = function (cli, options, done) {

    cli.beforeAll(function (data, flags, done) {

      ranBeforeAll = true;
      done();
    });

    cli.command('test')
      .handler(function (data, flags, done) {

        commandCalled = true;
        done();
      });

    t.deepEqual(options, {key: 'value'}, 'passed options into plugin');

    done();
  };

  cli.register([
    {
      register: plugin1,
      options: {
        key: 'value'
      }
    }
  ], function () {

    cli.run(['', '', 'test'], function () {

      t.ok(commandCalled, 'ran command from plugin');
      t.ok(ranBeforeAll, 'ran before all from plugin');
    });
  });
});

test('cli: register a single plugin', function (t) {

  t.plan(3);

  var cli = nash();
  var commandCalled = false;
  var ranBeforeAll = false;

  var plugin1 = function (cli, options, done) {

    cli.beforeAll(function (data, flags, done) {

      ranBeforeAll = true;
      done();
    });

    cli.command('test')
      .handler(function (data, flags, done) {

        commandCalled = true;
        done();
      });

    t.deepEqual(options, {key: 'value'}, 'passed options into plugin');

    done();
  };

  cli.register({
    register: plugin1,
    options: {
      key: 'value'
    }
  }, function () {

    cli.run(['', '', 'test'], function () {

      t.ok(commandCalled, 'ran command from plugin');
      t.ok(ranBeforeAll, 'ran before all from plugin');
    });
  });
});

test('cli: registers plugin with no options', function (t) {

  t.plan(2);

  var cli = nash();
  var commandCalled = false;
  var ranBeforeAll = false;

  var plugin1 = function (cli, options, done) {

    cli.beforeAll(function (data, flags, done) {

      ranBeforeAll = true;
      done();
    });

    cli.command('test')
      .handler(function (data, flags, done) {

        commandCalled = true;
        done();
      });

    done();
  };

  cli.register({register: plugin1}, function () {

    cli.run(['', '', 'test'], function () {

      t.ok(commandCalled, 'ran command from plugin');
      t.ok(ranBeforeAll, 'ran before all from plugin');
    });
  });
});

test('cli: registers multiple plugins as an array', function (t) {

  t.plan(3);

  var cli = nash();
  var commandCalled = false;
  var command2Called = false;
  var ranBeforeAll = false;

  var plugin1 = function (cli, options, done) {

    cli.beforeAll(function (data, flags, done) {

      ranBeforeAll = true;
      done();
    });

    cli.command('test')
      .handler(function (data, flags, done) {

        commandCalled = true;
        done();
      });

    done();
  };

  var plugin2 = function (cli, options, done) {

    cli.command('test2')
      .handler(function (data, flags, done) {

        command2Called = true;
        done();
      });

    done();
  };

  cli.register([
    {
      register: plugin1,
      options: {key: 'value'}
    },
    {
      register: plugin2,
      options: {key: 'value'}
    }
  ], function () {

    cli.run(['', '', 'test'], function () {

      cli.run(['', '', 'test2'], function () {

        t.ok(commandCalled, 'ran command from plugin');
        t.ok(ranBeforeAll, 'ran before all from plugin');
        t.ok(command2Called, 'ran command 2 from plugin');
      });
    });
  });
});

test('cli: getters/setters', function (t) {

  var cli = nash();

  t.ok(typeof cli.set === 'function', 'setter exists');

  cli.set('key', 'value');

  t.ok(typeof cli.get === 'function', 'getter exists');
  t.equal(cli.get('key'), 'value', 'getter');

  cli.set({
    key1: 'value1',
    key2: 'value2'
  });

  t.equal(cli.get('key1'), 'value1', 'set first value');
  t.equal(cli.get('key2'), 'value2', 'set second value');

  t.end();
});

test('cli: process data', function (t) {

  var cli = nash();

  cli.default()
    .handler(function (data, flags, done) {

      t.equal(cli.process.command, 'command', 'command');
      t.equal(cli.process.task, 'task', 'task');
      t.deepEqual(cli.process.data, ['data'], 'data');
      t.deepEqual(cli.process.flags, {flag: 'flag', f: 'flag'}, 'flags');

      cli.process.newValue = 'new value';

      t.notOk(cli.process.newValue, 'immutable');

      done();
    });

  cli.flag('-f', '--flag');

  cli.run(['', '', 'command:task', 'data', '--flag', 'flag'], function () {

    t.end();
  });
});
