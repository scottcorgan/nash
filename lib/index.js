var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');
var minimist = require('minimist');
var asArray = require('as-array');
var flatten = require('flat-arguments');
var async = require('async');
var defineCommand = require('./command');
var mixin = _.extend;

var exports = module.exports = function createCli (options) {  
  return new Cli(options);
};

var Cli = exports.Cli = function (options) {
  
  this.options = options || {};
  
  this._commands = [];
  this._beforeAlls = [];
  this._afterAlls = [];
  this._onInvalidCommand = function () {};
  
  mixin(this, EventEmitter.prototype);
};

Cli.prototype.command = function () {
  
  var command = defineCommand(flatten(arguments));
  this._commands.push(command);
  
  return command;
};

// TODO: allow any number of functions to be passed here
Cli.prototype.beforeAll = function (fn) {
  
  this._beforeAlls.push(fn.bind(this));
  
  return this;
};

Cli.prototype.afterAll = function (fn) {
  
  this._afterAlls.push(fn.bind(this));
  
  return this;
};

Cli.prototype.onInvalidCommand = function (fn) {
  
  this._onInvalidCommand = fn.bind(this);
  
  return this;
};

Cli.prototype.run = function (argv, runDone) {
  
  runDone = runDone || function () {};
  
  var self = this;
  this.argv = minimist(asArray(argv).slice(2));
  var command = parseCommand(this.argv);
  
  // TODO:
  // abstract out cli-command and cli-flag as modules?\
  // abstract help menu to it's own module
  
  // Order of operation
  // x 1. beforeAlls
  // - 2. flags
  // x 3. command/tasks
  // x 4. catchAll
  // x 5. afterAlls
  
  async.series({
    beforeAlls: function (done) {
      
      self.runBeforeAlls(command.data, command.flags, done);
    },
    command: function (done) {
      
      // Execute command, task, or nothing
      var commandToRun = 
        self.findCommandTask(command.name, command.task) ||
        self.findCommand(command.name, command.task);
      
      if (commandToRun) {
        commandToRun.run(command.data, command.flags, done);
      }
      else {
        self._onInvalidCommand(command.name, command.data, command.flags, done);
      }
    },
    afterAlls: function (done) {
      
      self.runAfterAlls(command.data, command.flags, done);
    }
  }, runDone);
  
  return this;
};

Cli.prototype.runBeforeAlls = function (data, flags, done) {
  
  async.eachSeries(this._beforeAlls, function (beforeFn, beforeFnDone) {
    
    beforeFn(data, flags, beforeFnDone);
  }, done);
};

Cli.prototype.runAfterAlls = function (data, flags, done) {
  
  async.eachSeries(this._afterAlls, function (afterFn, afterFnDone) {
    
    afterFn(data, flags, afterFnDone);
  }, done);
};

Cli.prototype.findCommand = function (commandName, taskName) {
  
  var commandToRun = _.find(this._commands, function (definedCommand) {
    
    return definedCommand.matchesName(commandName) && !taskName;
  });
  
  return commandToRun;
};

Cli.prototype.findCommandTask = function (commandName, taskName) {
  
  var taskCommand = _.find(this._commands, function (definedCommand) {
    
    return definedCommand.matchesTask(commandName, taskName);
  });
  
  return (taskCommand) ? taskCommand.task(taskName) : undefined;
};

// Helper Methods

function parseCommand (args) {
  
  if (args._.length === 0) return {};
  
  var data = args._[0];
  
  return {
    name: commandName(data),
    task: taskName(data),
    data: commandData(args._),
    flags: commandFlags(args)
  };
}

function commandName (args) {
  
  return args.split(':')[0];
}

function taskName (args) {
  
 return args.split(':')[1]; 
}

function commandData (data) {
  
  return _.rest(data);
}

function commandFlags (args) {
  
  return _.omit(args, '_');
}