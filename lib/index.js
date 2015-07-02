var EventEmitter = require('events').EventEmitter;

var _ = require('lodash');
var minimist = require('minimist');
var flatten = require('flat-arguments');
var async = require('async');

var commandFactory = require('./command');
var commands = require('./commands');
var flags = require('./flags');
var flagFactory = require('./flag');
var wrappers = require('./wrappers');
var parseCommand = require('./utils/parse-command');
var extendFlags = require('./utils/extend-flags');
var bindAll = require('./utils/bind-all-fns');
var flagRunner = require('./utils/flag-runner');

function parseArgv (processArgv, rawFlags) {

  // WIP: parse flags with defaults
  var argvOptions = {
    alias: {},
    default: {}
  };

  rawFlags.forEach(function (flag) {

    var names = flag.name().map(flagFactory.unprefix);
    var baseName = names[0];
    var aliases = [];

    if (names.length > 1) {
      aliases = _.rest(names);
    }

    argvOptions.alias[baseName] = aliases;
  });

  return minimist(_.slice(processArgv, 2), argvOptions);
}

var Cli = exports.Cli = function (options) {

  this.process = {};
  this.attributes = {};
  this.options = options || {};
  this.internals = {
    commands: commands(),
    flags: flags(),
    beforeAlls: wrappers(),
    afterAlls: wrappers(),
    decorators: {},
    plugins: []
  };

  _.extend(this, EventEmitter.prototype);
};

module.exports = function createCli (options) {
  return new Cli(options);
};


// Instantiators

Cli.prototype.command = function () {

  var names = flatten(arguments);
  var command = commandFactory(names);

  this.internals.commands.add(command);

  return this.findCommand(names);
};

Cli.prototype.flag = function () {

  var names = flatten(arguments);
  var flag = flagFactory(names);

  this.internals.flags.add(flag);

  return this.findFlag(names);
};

Cli.prototype.beforeAll = function () {

  this.internals.beforeAlls.add(bindAll(this, arguments));

  return this;
};

Cli.prototype.afterAll = function () {

  this.internals.afterAlls.add(bindAll(this, arguments));

  return this;
};

Cli.prototype.default = function () {

  var command = commandFactory();
  this.internals.defaultCommand = this.internals.defaultCommand || command;

  return command;
};

Cli.prototype.run = function (processArgv, runDone) {

  runDone = runDone || function () {};

  var self = this;
  var command = parseCommand(minimist(_.slice(processArgv, 2)));

  // Set up decorators
  command.decorators = this.internals.decorators.command;

  // Execute command, task, or nothing
  var commandToRun =
    self.findCommandTask(command.name, command.task) ||
    self.findCommand(command.name);

  // Parse all falgs with aliases, defaults, etc.
  this.argv = parseArgv(
    processArgv,
    extendFlags(
      self.internals.flags.all(),
      commandToRun ? commandToRun.internals.flags.all() : []
    )
  );
  command.flags = _.omit(this.argv);

  // Set process data
  this.process = Object.freeze({
    command: command.name,
    task: command.task,
    data: command.data,
    flags: _.omit(this.argv, '_')
  });

  // Run everything
  async.series({
    beforeAlls: function (done) {

      self.runBeforeAlls(command.data, command.flags, done);
    },
    flags: function (done) {

      var commandFlags;

      // If command that is getting run has flags that match
      // global flags, we need to run those too
      if (commandToRun) {
        commandFlags = commandToRun.internals.flags.all();
      }

      self.runFlags(command.flags, done, commandFlags);
    },
    command: function (done) {

      self.internals.commands.run(command, function (err) {

        // Try running default command
        if (err && self.internals.defaultCommand) {
          command.data = self.argv._;
          return self.internals.defaultCommand.run(command.data, command.flags, done);
        }

        // Finish up no matter what
        done();
      });
    },
    afterAlls: function (done) {

      self.runAfterAlls(command.data, command.flags, done);
    }
  }, runDone);

  return this;
};


// Runners

Cli.prototype.runFlags = function (flagMap, done, _commandFlags_) {

  // Combine global and command-level flags
  var flgs = extendFlags(this.internals.flags.all(), _commandFlags_);

  // Run flags from flag map
  flagRunner(flagMap, flgs, done);
};

Cli.prototype.runFlag = function (name, data, done) {

  done = done || function () {};

  var flag = this.findFlag(name);

  if (!flag) {
    throw new Error('Flag does not exist');
  }

  flag.run(data, done);

  return this;
};

Cli.prototype.runBeforeAlls = function (data, flgs, done) {

  this.internals.beforeAlls.run(data, flgs, done);

  return this;
};

Cli.prototype.runAfterAlls = function (data, flgs, done) {

  this.internals.afterAlls.run(data, flgs, done);

  return this;
};


// Finders

Cli.prototype.findCommand = function () {

  return this.internals.commands.findByName(arguments);
};

Cli.prototype.findCommandTask = function (commandName, taskName) {

  var cmd = this.findCommand(commandName);

  if (!cmd) {
    return;
  }

  return cmd.findTask(taskName);
};

Cli.prototype.findFlag = function () {

  return this.internals.flags.findByName(arguments);
};

Cli.prototype.decorate = function (target, name, handler) {

  if (target === 'flag') {
    flagFactory.decorators.push({
      name: name,
      handler: handler
    });
  }

  if (target === 'command') {
    commandFactory.decorators.push({
      name: name,
      handler: handler
    });
  }

  return this;
};

Cli.prototype.set = function (name, value) {

  if (_.isObject(name)) {

    _.each(name, function (val, key) {

      this.attributes[key] = val;
    }, this);
  }
  else {

    this.attributes[name] = value;
  }

  return this;
};

Cli.prototype.get = function (name) {

  return this.attributes[name];
};

Cli.prototype.register = function (plugins, done) {

  var self = this;

  done = done || function () {};

  // Force object to array
  if (plugins.register) {
    plugins = [plugins];
  }

  async.eachSeries(plugins, function (plugin, doneRegistering) {

    plugin.register(self, plugin.options || {}, doneRegistering);
  }, done);

  return this;
};
