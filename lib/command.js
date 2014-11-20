var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');
var async = require('async');
var flatten = require('flat-arguments');
var asArray = require('as-array');
var defineFlag = require('./flag');
var flags = require('./flags');
var commands = require('./commands');
var name = require('./name');
var wrappers = require('./wrappers');

var defineCommand = module.exports = function () {
  
  // TODO: test command decorators individually
  _.each(defineCommand.decorators, function (decorator) {
    
    Command.prototype[decorator.name] = decorator.handler;
  });
  
  // Also ensure that the name is always an array
  // This gives us the ability to have multiple names/aliases
  return new Command(arguments);
};

defineCommand.decorators = [];

// helps avoid runtime errors with missing commands
defineCommand.noop = function () {
  
  return new Command();
};

// Command Class
function Command () {
  
  this.internals = {
    name: name(arguments),
    description: '',
    usage: '',
    hidden: false,
    async: false,
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
      
      command.runFlags(flagMap, done);
    },
    handler: function (done) {
      
      // Arguments to pass to handler function
      var handlerData = (command.isAsync()) ? data.concat([done]) : data;
      var handler = command.internals.handler;
      
      if (handler) {
        handler.apply(command, handlerData);
      }
      
      // Finish no matter what
      if (!command.isAsync() || !handler) {
        done();
      }
    },
    afters: function (done) {
      
      command.runAfters(data, flagMap, done);
    }
  }, done);
  
  return this;
};

Command.prototype.async = function (val) {
  
  this.internals.async = (val !== false) ? true : false;
  
  return this;
};

Command.prototype.isAsync = function () {
  
  return this.internals.async;
};

Command.prototype.runBefores = function (data, flags, done) {
  
  done = done || function () {};
  
  // Set all befores as async or not
  this.internals.befores
    .async(this.isAsync())
    .run(data, flags, done);
  
  if (!this.isAsync()) {
    done();
  }

  return this;
};

Command.prototype.runAfters = function (data, flags, done) {
  
  done = done || function () {};
  
  // Set all afters as async or not
  this.internals.afters
    .async(this.isAsync())
    .run(data, flags, done);
    
  if (!this.isAsync()) {
    done();
  }

  return this;
};

Command.prototype.runFlags = function (flagMap, done) {
  
  done = done || function () {};
  
  var self = this;
  var allFlags = this.internals.flags.all();
  var isAsync = this.isAsync();
  
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
  
  done();
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
  
  var names = flatten(arguments);
  
  this.internals.flags.add(defineFlag(names));
  
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

Command.prototype.isHidden = function () {
  
  return this.internals.hidden; 
};

// TODO: move to help module
Command.prototype.hidden = function (val) {
  
  this.internals.hidden = (val !== false) ? true : false; // Is true if no value
  
  return this;
};

Command.prototype.before = function (fn) {
  
  if (!fn) {
    return this.internals.befores.all();
  }
  
  this.internals.befores.add(bindAllFunctionsTo(this, arguments));
  
  return this;
};

Command.prototype.after = function (fn) {
  
  if (!fn) {
    return this.internals.afters.all();
  }
  
  this.internals.afters.add(bindAllFunctionsTo(this, arguments));
  
  return this;
};

// TODO: move to help module
Command.prototype.description = function (val) {
  
  if (arguments.length === 0) {
    return this.internals.description;
  }
  
  this.internals.description = val;
  
  return this;
};

// TODO: move to help module
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

// Helpers

// Function bind helper
function bindAllFunctionsTo (ctx, fns) {
  
  return _.map(fns, bindTo(ctx));
}

function bindTo (ctx) {
  return function (fn) {
    return fn.bind(ctx);
  };
}