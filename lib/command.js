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

  var self = this;

  // Execute all aspects of running a command
  async.series({
    befores: function (beforesDone) {

      self.runBefores(data, flagMap, beforesDone);
    },
    flags: function (flagsDone) {

      self.runFlags(flagMap, flagsDone);
    },
    handler: function (handlerDone) {

      var handler = self.internals.handler;

      if (handler) {
        handler(data, flagMap, handlerDone);
      }
      else {
        done();
      }
    },
    afters: function (aftersDone) {

      self.runAfters(data, flagMap, aftersDone);
    }
  }, done);

  return this;
};

Command.prototype.runBefores = function (data, flgs, done) {

  done = done || function () {};

  // Set all befores as async or not
  this.internals.befores
    .run(data, flgs, done);

  return this;
};

Command.prototype.runAfters = function (data, flgs, done) {

  done = done || function () {};

  // Set all afters as async or not
  this.internals.afters
    .run(data, flgs, done);

  return this;
};

Command.prototype.runFlags = function (flagMap, done) {

  done = done || function () {};

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
