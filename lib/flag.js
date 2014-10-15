var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');
var flatten = require('flat-arguments');
var name = require('./name');
var mixin = _.extend;

var defineFlag = module.exports = function () {
  
  // Also ensure that the name is always an array
  // This gives us the ability to have multiple names/aliases
  return new Flag(arguments);
};

function Flag () {
  
  this.internals = {
    name: name(arguments),
    description: '',
    usage: '',
    exit: false,
    hidden: false,
    ran: false,
    handler: function () {}
  };
  
  mixin(this, EventEmitter.prototype);
}

Flag.prototype._exitProcess = function (code) {
  
  process.exit(code);
};

Flag.prototype.run = function (data, done) {
  
  this.internals.handler(data);
  this.internals.ran = true;
  
  if (this.internals.exit) {
    this._exitProcess(0);
  }
  
  return this;
};

Flag.prototype.runOnce = function () {
  
  if (!this.internals.ran) {
    this.run.apply(this, arguments);
  }
  
  return this;
};

Flag.prototype.matchesName = function (flagName) {
  
  return this.internals.name.matches(arguments);
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

Flag.prototype.shouldOverride = function () {
  
  return this.internals.override;
};

Flag.prototype.override = function (val) {
  
  this.internals.override = (val !== false) ? true : false; // Is true if no value
  
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
    return this.internals.name.all();
  }
  
  this.internals.name.add(val);
  
  return this;
};