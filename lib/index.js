var EventEmitter = require('events').EventEmitter;

var _ = require('lodash');
var minimist = require('minimist');
var flatten = require('flat-arguments');
var async = require('async');

var defineCommand = require('./command');
var commands = require('./commands');
var flags = require('./flags');
var defineFlag = require('./flag');
var wrappers = require('./wrappers');
var parseCommand = require('./utils/parse-command');
var extendFlags = require('./utils/extend-flags');
var bindAll = require('./utils/bind-all-fns');
var flagRunner = require('./utils/flag-runner');

var exports = module.exports = function createCli (options) {  
  return new Cli(options);
};

var Cli = exports.Cli = function (options) {
  
  this.attributes = {};
  this.options = options || {};
  this.internals = {
    commands: commands(),
    flags: flags(),
    beforeAlls: wrappers(),
    afterAlls: wrappers(),
    decorators: {}
  };
  
  _.extend(this, EventEmitter.prototype);
};


// Instantiators

Cli.prototype.command = function () {
  
  var names = flatten(arguments);
  var command = defineCommand(names);
    
  this.internals.commands.add(command);
  
  return this.findCommand(names);
};

Cli.prototype.flag = function () {
  
  var names = flatten(arguments);
  var flag = defineFlag(names);
  
  this.internals.flags.add(flag);
  
  return this.findFlag(names);
};

Cli.prototype.beforeAll = function () {
  
  this.internals.beforeAlls.add(bindAll(this, arguments));
  
  return this;
};

Cli.prototype.afterAll = function (fn) {
  
  this.internals.afterAlls.add(bindAll(this, arguments));
  
  return this;
};


// TODO: this should have an async mode as well?
Cli.prototype.onInvalidCommand = function (fn) {
  
  this.internals.onInvalidCommand = fn.bind(this);
  
  return this;
};

Cli.prototype.default = function () {
  
  var command = defineCommand();
  this.internals.defaultCommand = this.internals.defaultCommand || command;
  
  return command;
};

Cli.prototype.run = function (argv, runDone) {
  
  runDone = runDone || function () {};
  
  var self = this;
  this.argv = minimist(_.toArray(argv).slice(2));
  var command = parseCommand(this.argv);
  
  // Set up decorators
  command.decorators = this.internals.decorators.command;
  
  // Execute command, task, or nothing
  var commandToRun = 
    self.findCommandTask(command.name, command.task) ||
    self.findCommand(command.name);
  
  // TODO:
  // abstract out cli-command and cli-flag as modules?
  // abstract help menu to it's own module
  
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
        
        // Maybe this is an invalid command name?
        if (err && typeof self.internals.onInvalidCommand === 'function') {
          self.internals.onInvalidCommand(command.name, command.data, command.flags);
        }
        
        // Try running default command
        else if (err && self.internals.defaultCommand) {
          
          // Command name should now be the first argument since
          // this is the default command
          command.data = (self.argv._ || []).concat(command.data);
          
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
  var flags = extendFlags(this.internals.flags.all(), _commandFlags_);
  
  // Run flags from flag map
  flagRunner(flagMap, flags);
  done();
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

Cli.prototype.runBeforeAlls = function (data, flags, done) {
  
  this.internals.beforeAlls.run(data, flags);
  done();
  
  return this;
};

Cli.prototype.runAfterAlls = function (data, flags, done) {
  
  this.internals.afterAlls.run(data, flags);
  done();
  
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
    defineFlag.decorators.push({
      name: name,
      handler: handler
    });
  }
  
  if (target === 'command') {
   defineCommand.decorators.push({
     name: name,
     handler: handler
   }); 
  }
  
  return this;
};

Cli.prototype.set = function (name, value) {
  
  this.attributes[name] = value;
  
  return this;
};

Cli.prototype.get = function (name) {
  
  return this.attributes[name];
};

Cli.prototype.register = function () {
  
  var cli = this;
  
  var args = flatten(arguments);
  var options = {};
  var plugins = args;
  
  // Only get options if options are passed
  if (args.length > 1) {
    options = args.pop();
    plugins = args;
  }
  
  _.each(plugins, function (plugin) {
  
    plugin.register(cli, options);
  });
  
  return this;
};