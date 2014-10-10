var _ = require('lodash');
var minimist = require('minimist');
var asArray = require('as-array');
var flatten = require('flat-arguments');
var async = require('async');
var defineCommand = require('./command');

var proto = module.exports = {
  _commands: [],
  _beforeAlls: [],
  _afterAlls: []
};

proto.command = function () {
  
  var command = defineCommand(flatten(arguments));
  this._commands.push(command);
  
  return command;
};

// TODO: allow any number of functions to be passed here
proto.beforeAll = function (fn) {
  
  this._beforeAlls.push(fn.bind(this));
  
  return this;
};

proto.afterAll = function (fn) {
  
  this._afterAlls.push(fn.bind(this));
  
  return this;
};

proto.run = function (argv, runDone) {
  
  runDon = runDone || function () {};
  
  var self = this;
  this.argv = minimist(asArray(argv).slice(2));
  var command = parseCommand(this.argv);
  
  
  
  // TODO:
  // how do we handle cli level flags vs
  // command level flags?
  
  // TODO:
  // abstract out cli-command and cli-flag as modules?\
  // abstract help menu to it's own module
  
  // Order of operation
  // * 1. beforeAlls
  // - 2. flags
  // x 3. command/tasks
  // - 4. catchAll
  // * 5. afterAlls
  
  async.series({
    beforeAlls: function (done) {
      
      self.runBeforeAlls(command.data, command.flags, done);
    },
    command: function (done) {
      
      // Execute command, task, or nothing
      var commandToRun = 
        self.findCommandTask(command.name, command.task) ||
        self.findCommand(command.name, command.task) ||
        defineCommand.noop();
      
      commandToRun.run(command.data, command.flags, done);
    },
    afterAlls: function (done) {
      
      self.runAfterAlls(command.data, command.flags, done);
    }
  }, runDone);
  
  return this;
};

proto.runBeforeAlls = function (data, flags, done) {
  
  async.eachSeries(this._beforeAlls, function (beforeFn, beforeFnDone) {
    
    beforeFn(data, flags, beforeFnDone);
  }, done);
};

proto.runAfterAlls = function (data, flags, done) {
  
  async.eachSeries(this._afterAlls, function (afterFn, afterFnDone) {
    
    afterFn(data, flags, afterFnDone);
  }, done);
};

proto.findCommand = function (commandName, taskName) {
  
  var commandToRun = _.find(this._commands, function (definedCommand) {
    
    return definedCommand.matchesName(commandName) && !taskName;
  });
  
  return commandToRun;
};

proto.findCommandTask = function (commandName, taskName) {
  
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