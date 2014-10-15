var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');
var flatten = require('flat-arguments');
var mixin = _.extend;

var defineFlag = module.exports = function () {
  
  // Also ensure that the name is always an array
  // This gives us the ability to have multiple names/aliases
  return new Flag(flatten(arguments));
};

function Flag (name) {
  
  this.internals = {
    name: name,
    description: '',
    usage: '',
    exit: false,
    hidden: false,
    handler: function () {}
  };
  
  mixin(this, EventEmitter.prototype);
}

Flag.prototype._exitProcess = function (code) {
  
  process.exit(code);
};

Flag.prototype.run = function (data, done) {
  
  this.internals.handler(data);
  
  if (this.internals.exit) {
    this._exitProcess(0);
  }
  
  return this;
};

Flag.prototype.matchesName = function (flagName) {
  
  return _.contains(this.internals.name, flagName);
};

Flag.prototype.handler = function (fn) {
  
  if (arguments.length === 0) {
    return this.internals.handler;
  }
  
  this.internals.handler = fn.bind(this);
  
  return this;
};

Flag.prototype.description = function (val) {
  
  if (arguments.length === 0) {
    return this.internals.description;
  }
  
  this.internals.description = val;
  
  return this;
};

Flag.prototype.usage = function (val) {
  
  if (arguments.length === 0) {
    return this.internals.usage;
  }
  
  this.internals.usage = val;
  
  return this;
};

Flag.prototype.shouldExit = function () {
  
  return this.internals.exit;
};

Flag.prototype.exit = function (val) {
  
  this.internals.exit = (val !== false) ? true : false; // Is true if no value
  
  return this;
};

Flag.prototype.isHidden = function () {
  
  return this.internals.hidden;
};

Flag.prototype.hidden = function (val) {
  
  this.internals.hidden = (val !== false) ? true : false; // Is true if no value
  
  return this;
};

Flag.prototype.name = function (val) {
  
  if (arguments.length === 0) {
    return this.internals.name;
  }
  
  this.internals.name.push(val);
  
  return this;
};