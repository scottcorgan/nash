var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');
var asArray = require('as-array');
var mixin = _.extend;

var defineCommand = module.exports = function (name) {
  
  // Also ensure that the name is always an array
  // This gives us the ability to have multiple names/aliases
  return new Command(asArray(name));
};

// helps avoid runtime errors with missing commands
defineCommand.noop = function () {
  
  return new Command();
};

defineCommand.beforeNoop = function () {
  
};

defineCommand.afterNoop = function () {
  
};

function Command (name) {
  
  var defaults = {
    _name: name,
    _description: '',
    _usage: '',
    _secret: false,
    _flags: [],
    _befores: [],
    _afters: [],
    _tasks: [],
    _handler: function () {}
  };
  
  mixin(this, defaults);
  mixin(this, EventEmitter.prototype);
}

Command.prototype.run = function (data) {
  
  // Order of execution
  // 1. befores
  // 2. flags
  // 3. handler
  // 4. afters
  
  this._handler.apply(this, data);
  
  return this;
};

Command.prototype.matchesName = function (commandName) {
  
  return _.contains(this._name, commandName);
};

Command.prototype.matchesTask = function (commandName, taskName) {
  
  return this.matchesName(commandName)
    && _.find(this._tasks, function (definedTask) {
      
      return definedTask.matchesName(taskName);
    });
}

Command.prototype.handler = function (fn) {
  
  if (arguments.length === 0) {
    return this._handler;
  }
  
  this._handler = fn.bind(this);
  
  return this;
};

Command.prototype.task = function () {
  
  var name = asArray(arguments);
  var t = this.findTask.apply(this, name);
  var task = t || defineCommand(name);
  
  // Only add task to the queue
  // if id didn't exist before
  if (!t) {
    this._tasks.push(task);
  }
  
  // Remove ability for command tasks to create
  // sub tasks of themself. At least for now.
  delete task.task;
  
  return task;
};

Command.prototype.findTask = function () {
  
  var names = asArray(arguments);
  var task;
  
  _.each(names, function (name) {
    
    task = _.find(this._tasks, function (t) {
      
      return t.matchesName(name);
    });
  }, this);
  
  return task;
};

Command.prototype.flag = function () {
  
  return this;
};

Command.prototype.secret = function (val) {
  
  if (arguments.length === 0) {
    return this._secret;
  }
  
  this._secret = val;
  
  return this;
};

Command.prototype.before = function (fn) {
  
  this._befores.push(fn || defineCommand.beforeNoop() );
  
  return this;
};

Command.prototype.after = function (fn) {
  
  this._afters.push(fn || defineCommand.afterNoop());
  
  return this;
};

Command.prototype.description = function (val) {
  
  if (arguments.length === 0) {
    return this._description;
  }
  
  this._description = val;
  
  return this;
};

Command.prototype.usage = function (val) {
  
  if (arguments.length === 0) {
    return this._usage;
  }
  
  this._usage = val;
  
  return this;
};