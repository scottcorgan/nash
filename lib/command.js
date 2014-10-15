var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');
var async = require('async');
var flatten = require('flat-arguments');
var asArray = require('as-array');
var defineFlag = require('./flag');
var flags = require('./flags');
var commands = require('./commands');
var name = require('./name');
var mixin = _.extend;


var defineCommand = module.exports = function () {
  // Also ensure that the name is always an array
  // This gives us the ability to have multiple names/aliases
  return new Command(arguments);
};

// helps avoid runtime errors with missing commands
defineCommand.noop = function () {
  
  return new Command();
};

// Command Class
function Command () {
  
  // TODO: tasks collection should be a "commands" collection
  
  this.internals = {
    name: name(arguments),
    description: '',
    usage: '',
    hidden: false,
    befores: [],
    flags: flags(),
    tasks: commands(),
    // tasks: [],
    afters: [],
    handler: function () {}
  };
  
  mixin(this, EventEmitter.prototype);
}

Command.prototype.run = function (data, flagMap, done) {
  
  done = done || function () {};
  
  var command = this;
  
  // Warn about deprecation
  if (command.isDeprecated()) {
    this.emit('warning', this.internals.deprecated.message);
  }
    
  // Exit on deprecation if it should
  if (command.deprecatedShouldExit()) { 
    done();
    return this;
  }
  
  // Execute all aspects of running a command
  async.series({
    befores: function (done) {
      
      command.runBefores(data, flagMap, done);
    },
    flags: function (done) {
      
      command.runFlags(flagMap);
      done();
    },
    handler: function (done) {
      
      command.internals.handler.apply(command, data);
      done();
    },
    afters: function (done) {
      
      command.runAfters(data, flagMap, done);
    }
  }, done);
  
  return this;
};


// TODO: abstract into class "CommandWrappers"
// CommandWrappers.prototype.run() / etc.
// CommandWrappers.protoytpe.push()
Command.prototype.runBefores = function (data, flags, runBeforesDone) {
  
  async.eachSeries(this.internals.befores, function (before, done) {
    
    before(data, flags, done);
  }, runBeforesDone);
};

Command.prototype.runAfters = function (data, flags, runAftersDone) {
  
  async.eachSeries(this.internals.afters, function (before, done) {
    
    before(data, flags, done);
  }, runAftersDone);
};

Command.prototype.runFlags = function (flagMap) {
  
  var allFlags = this.internals.flags.all();
  
  _(flagMap)
    .keys()
      .each(function (flagName) {
        
        _(allFlags)
          .filter(function (flag) {
            return flag.matchesName(flagName);
          })
          .each(function (flag) {
            flag.runOnce(flagMap[flagName]);
          });
    });
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
  
  this.internals.tasks.add(defineCommand(names));
  
  var task = this.findTask(names);
  
  // Ensure tasks and create tasks on itself
  task.task = undefined;
  
  return task;
};

Command.prototype.flag = function () {
  
  var name = flatten(arguments);
  var f = this.findFlag(name);
  var flag = f || defineFlag(name);
  
  // Only add flag to the queue
  // if id didn't exist before
  if (!f) {
    this.internals.flags.add(flag);
  }
  
  return flag;
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

Command.prototype.isHidden = function () {
  
  return this.internals.hidden; 
};

Command.prototype.hidden = function (val) {
  
  this.internals.hidden = (val !== false) ? true : false; // Is true if no value
  
  return this;
};

Command.prototype.before = function (fn) {
  
  if (!fn) {
    return this.internals.befores;
  }
  
  this.internals.befores.push(fn);
  
  return this;
};

Command.prototype.after = function (fn) {
  
  if (!fn) {
    return this.internals.afters;
  }
  
  this.internals.afters.push(fn);
  
  return this;
};

Command.prototype.description = function (val) {
  
  if (arguments.length === 0) {
    return this.internals.description;
  }
  
  this.internals.description = val;
  
  return this;
};

Command.prototype.usage = function (val) {
  
  if (arguments.length === 0) {
    return this.internals.usage;
  }
  
  this.internals.usage = val;
  
  return this;
};

Command.prototype.deprecate = function (msg, options) {
  
  this.internals.deprecated = _.extend({exit: true}, options, {
    message: msg
  });
  
  return this;
};

Command.prototype.isDeprecated = function () {
  
  return (this.internals.deprecated)
    ? !!this.internals.deprecated.message
    : false;
};

Command.prototype.deprecatedShouldExit = function () {
  
  return (this.internals.deprecated)
    ? this.internals.deprecated.exit !== false
    : false;
};