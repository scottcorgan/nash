var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');
var minimist = require('minimist');
var asArray = require('as-array');
var flatten = require('flat-arguments');
var async = require('async');
var defineCommand = require('./command');
var defineFlag = require('./flag');
var mixin = _.extend;

var exports = module.exports = function createCli (options) {  
  return new Cli(options);
};

var Cli = exports.Cli = function (options) {
  
  this.options = options || {};
  this.internals = {
    commands: [],
    flags: [],
    beforeAlls: [],
    afterAlls:[],
    onInvalidCommand: function () {}
  };
  
  mixin(this, EventEmitter.prototype);
};


// Instantiators

Cli.prototype.command = function () {
  
  var names = flatten(arguments);
  var c = this.findCommand(names);
  var command = c || defineCommand(names);
  
  // Only add Command to the queue
  // if id didn't exist before
  if (!c) {
    this.internals.commands.push(command);
  }
  
  return command;
};

Cli.prototype.flag = function () {
  
  var names = flatten(arguments);
  var f = this.findFlag(names);
  var flag = f || defineFlag(names);
  
  // Only add flag to the queue
  // if id didn't exist before
  if (!f) {
    this.internals.flags.push(flag);
  }
  
  return flag;
};

Cli.prototype.beforeAll = function (fn) {
  
  // TODO: allow any number of functions to be passed here
  
  this.internals.beforeAlls.push(fn.bind(this));
  
  return this;
};

Cli.prototype.afterAll = function (fn) {
  
  this.internals.afterAlls.push(fn.bind(this));
  
  return this;
};

Cli.prototype.onInvalidCommand = function (fn) {
  
  this.internals.onInvalidCommand = fn.bind(this);
  
  return this;
};

Cli.prototype.run = function (argv, runDone) {
  
  runDone = runDone || function () {};
  
  var self = this;
  this.argv = minimist(asArray(argv).slice(2));
  var command = parseCommand(this.argv);
  
  // TODO:
  // abstract out cli-command and cli-flag as modules?
  // abstract help menu to it's own module
  
  async.series({
    beforeAlls: function (done) {
      
      self.runBeforeAlls(command.data, command.flags, done);
    },
    flags: function (done) {
      
      self.runFlags(command.flags, done);
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
        self.internals.onInvalidCommand(command.name, command.data, command.flags, done);
      }
    },
    afterAlls: function (done) {
      
      self.runAfterAlls(command.data, command.flags, done);
    }
  }, runDone);
  
  return this;
};


// Runners

Cli.prototype.runFlags = function (flagMap, done) {
  
  _(flagMap).keys().each(function (flagName) {
      
    var f = (flagName.length === 1) ? '-' + flagName : '--' + flagName;
    var flagsToRun = _.filter(this.internals.flags, function (flag) {
      
      return flag.matchesName(f);
    });
    
    _.each(flagsToRun, function (flag) {
      
      flag.run(flagMap[flagName]);
    });
  }, this);
  
  done();
};

Cli.prototype.runBeforeAlls = function (data, flags, done) {
  
  async.eachSeries(this.internals.beforeAlls, function (beforeFn, beforeFnDone) {
    
    beforeFn(data, flags, beforeFnDone);
  }, done);
};

Cli.prototype.runAfterAlls = function (data, flags, done) {
  
  async.eachSeries(this.internals.afterAlls, function (afterFn, afterFnDone) {
    
    afterFn(data, flags, afterFnDone);
  }, done);
};


// Finders

Cli.prototype.findCommand = function (commandName, taskName) {
  
  var commandToRun = _.find(this.internals.commands, function (definedCommand) {
    
    return definedCommand.matchesName(commandName) && !taskName;
  });
  
  return commandToRun;
};

Cli.prototype.findCommandTask = function (commandName, taskName) {
  
  var taskCommand = _.find(this.internals.commands, function (definedCommand) {
    
    return definedCommand.matchesTask(commandName, taskName);
  });
  
  return (taskCommand) ? taskCommand.task(taskName) : undefined;
};

Cli.prototype.findFlag = function () {
  
  var names = flatten(arguments);
  var flag;
  
  _.each(names, function (name) {
    
    flag = _.find(this.internals.flags, function (f) {
      
      return f.matchesName(name);
    });
  }, this);
  
  return flag;
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