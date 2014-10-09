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
  
  var defaults = {
    _name: name,
    _description: '',
    _usage: '',
    _exit: false,
    _hidden: false,
    _handler: function () {}
  };
  
  mixin(this, defaults);
  mixin(this, EventEmitter.prototype);
}

Flag.prototype._exitProcess = function (code) {
  
  process.exit(code);
};

Flag.prototype.run = function (data) {
  
  this._handler(data);
  
  if (this._exit) {
    this._exitProcess(0);
  }
  
  return this;
};

Flag.prototype.matchesName = function (flagName) {
  
  return _.contains(this._name, flagName);
};

Flag.prototype.handler = function (fn) {
  
  if (arguments.length === 0) {
    return this._handler;
  }
  
  this._handler = fn.bind(this);
  
  return this;
};

Flag.prototype.description = function (val) {
  
  if (arguments.length === 0) {
    return this._description;
  }
  
  this._description = val;
  
  return this;
};

Flag.prototype.usage = function (val) {
  
  if (arguments.length === 0) {
    return this._usage;
  }
  
  this._usage = val;
  
  return this;
};

Flag.prototype.exit = function (val) {
  
  if (arguments.length === 0) {
    return this._exit;
  }
  
  this._exit = val;
  
  return this;
};

Flag.prototype.hidden = function (val) {
  
  if (arguments.length === 0) {
    return this._hidden;
  }
  
  this._hidden = val;
  
  return this;
};

Flag.prototype.name = function (val) {
  
  if (arguments.length === 0) {
    return this._name;
  }
  
  this._name.push(val);
  
  return this;
};