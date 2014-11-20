var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');
var minimist = require('minimist');
var asArray = require('as-array');
var flatten = require('flat-arguments');
var async = require('async');
var defineCommand = require('./command');
var commands = require('./commands');
var flags = require('./flags');
var defineFlag = require('./flag');
var wrappers = require('./wrappers');
var parseCommand = require('./utils/parse-command');
var extendFlags = require('./utils/extend-flags');
var bindAllFunctionsTo = require('./utils/bind-all-fns');

var exports = module.exports = function createCli (options) {  
  return new Cli(options);
};

var Cli = exports.Cli = function (options) {
  
  this.options = options || {};
  this.internals = {
    commands: commands(),
    flags: flags(),
    beforeAlls: wrappers(),
    afterAlls: wrappers(),
    onInvalidCommand: function () {}
  };
  
  _.extend(this, EventEmitter.prototype);
};


// Instantiators

Cli.prototype.command = function () {
  
  var names = flatten(arguments);
  
  this.internals.commands.add(defineCommand(names));
  
  return this.findCommand(names);
};

Cli.prototype.flag = function () {
  
  var names = flatten(arguments);
  
  this.internals.flags.add(defineFlag(names));
  
  return this.findFlag(names);
};

Cli.prototype.beforeAll = function () {
  
  this.internals.beforeAlls.add(bindAllFunctionsTo(this, arguments));
  
  return this;
};

Cli.prototype.afterAll = function (fn) {
  
  this.internals.afterAlls.add(bindAllFunctionsTo(this, arguments));
  
  return this;
};


// TODO: this should have an async mode as well?
Cli.prototype.onInvalidCommand = function (fn) {
  
  this.internals.onInvalidCommand = fn.bind(this);
  
  return this;
};

Cli.prototype.run = function (argv, runDone) {
  
  runDone = runDone || function () {};
  
  var self = this;
  this.argv = minimist(asArray(argv).slice(2));
  var command = parseCommand(this.argv);
  
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
        
        if (err) {
          self.internals.onInvalidCommand(command.name, command.data, command.flags);
        }
        
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
  _(flagMap)
    .keys()
    .each(function (flagName) {
      
      _(flags)
        .filter(function (flag) {
          
          return flag.matchesName(flagName);
        })
        .each(function (flag) {
        
          flag.runOnce(flagMap[flagName]);
        });
    });
  
  done();
};

Cli.prototype.runFlag = function (name, data, done) {
  
  done = done || function () {};
  
  var flag = _.find(this.internals.flags.all(), function (f) {
    
    return f.matchesName(name);
  });
  
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