var EventEmitter = require('events').EventEmitter;

var _ = require('lodash');
var async = require('async');
var flatten = require('flat-arguments');

var flagFactory = require('./flag');
var flags = require('./flags');
var commands = require('./commands');
var name = require('./name');
var wrappers = require('./wrappers');
var flagRunner = require('./utils/flag-runner');
var bindAll = require('./utils/bind-all-fns');

var commandFactory = module.exports = function () {
  
  // TODO: test command decorators individually
  _.each(commandFactory.decorators, function (decorator) {
    
    Command.prototype[decorator.name] = decorator.handler;
  });
  
  // Also ensure that the name is always an array
  // This gives us the ability to have multiple names/aliases
  return new Command(arguments);
};

commandFactory.decorators = [];

// helps avoid runtime errors with missing commands
commandFactory.noop = function () {
  
  return new Command();
};

// Command Class
function Command () {
  
  this.internals = {
    name: name(arguments),
    befores: wrappers(),
    afters: wrappers(),
    flags: flags(),
    tasks: commands(),
    handler: null
  };
  
  _.extend(this, EventEmitter.prototype);
}

Command.prototype.run = function (data, flagMap, done) {
  
  done = done || function () {};
  
  var command = this;
  
  // Execute all aspects of running a command
  async.series({
    befores: function (done) {
      
      command.runBefores(data, flagMap, done);
    },
    flags: function (done) {
      
      command.runFlags(flagMap, done);
    },
    handler: function (done) {
      
      var handler = command.internals.handler;
      
      if (handler) {
        handler(data, flagMap, done);
      }
      else {
        done();
      }
    },
    afters: function (done) {
      
      command.runAfters(data, flagMap, done);
    }
  }, done);
  
  return this;
};

Command.prototype.runBefores = function (data, flags, done) {
  
  done = done || function () {};
  
  // Set all befores as async or not
  this.internals.befores
    .run(data, flags, done);
  
  return this;
};

Command.prototype.runAfters = function (data, flags, done) {
  
  done = done || function () {};
  
  // Set all afters as async or not
  this.internals.afters
    .run(data, flags, done);
    
  return this;
};

Command.prototype.runFlags = function (flagMap, done) {
  
  done = done || function () {};
  
  var self = this;
  var allFlags = this.internals.flags.all();
  
  flagRunner(flagMap, allFlags, done);
};

Command.prototype.matchesName = function () {
  
  return this.internals.name.matches(arguments);
};

Command.prototype.matchesTask = function (commandName, taskName) {
  
  return this.matchesName(commandName) && this.findTask(taskName);
};

Command.prototype.handler = function (fn) {
  
  if (arguments.length === 0) {
    return this.internals.handler;
  }
  
  this.internals.handler = fn.bind(this);
  
  return this;
};

Command.prototype.task = function () {
  
  var names = flatten(arguments);
  
  this.internals.tasks.add(commandFactory(names));
  
  var task = this.findTask(names);
  
  // Ensure tasks and create tasks on itself
  task.task = undefined;
  
  return task;
};

Command.prototype.flag = function () {
  var names = flatten(arguments);
  
  this.internals.flags.add(flagFactory(names));
  
  return this.findFlag(names);
};

Command.prototype.findTask = function () {
  
  return this.internals.tasks.findByName(arguments);
};

Command.prototype.findFlag = function () {
  
  return this.internals.flags.findByName(arguments);
};

Command.prototype.name = function (val) {
  
  if (arguments.length === 0) {
    return this.internals.name.all();
  }

  this.internals.name.add(val);
  
  return this;
};

Command.prototype.before = function (fn) {
  
  if (!fn) {
    return this.internals.befores.all();
  }
  
  this.internals.befores.add(bindAll(this, arguments));
  
  return this;
};

Command.prototype.after = function (fn) {
  
  if (!fn) {
    return this.internals.afters.all();
  }
  
  this.internals.afters.add(bindAll(this, arguments));
  
  return this;
};