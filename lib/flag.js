var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');
var flatten = require('flat-arguments');
var name = require('./name');

var flag = module.exports = function () {
  
  // TODO: flag command decorators individually
  _.each(flag.decorators, function (decorator) {
    
    Flag.prototype[decorator.name] = decorator.handler;
  });
  
  // Also ensure that the name is always an array
  // This gives us the ability to have multiple names/aliases
  return new Flag(arguments);
};

flag.decorators = [];

flag.addDashes = function (flagName) {
  
  // i.e. --flag or --test
  if (flagName.slice(0, 2) === '--' && flagName.length > 2) {
    return flagName;
  }
  
  // i.e: -t or -f
  if (flagName.slice(0, 1) === '-' && flagName.length < 3) {
    return flagName;
  }
  
  return (flagName.length === 1)
    ? '-' + flagName
    : '--' + flagName;
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
  
  _.extend(this, EventEmitter.prototype);
}

Flag.prototype._exitProcess = function (code) {
  
  process.exit(code);
};

Flag.prototype.run = function (data, done) {
  
  done = done || function () {};
  
  var self = this;
  
  if (this.isAsync()) {
    this.internals.handler(data, runDone);
  }
  
  else {
    this.internals.handler(data);
    runDone();
  }
  
  return this;
  
  function runDone () {
    
    self.internals.ran = true;
    done();
    
    if (self.internals.exit) {
      self._exitProcess(0);
    }
  }
};

Flag.prototype.runOnce = function () {
  
  if (!this.internals.ran) {
    this.run.apply(this, arguments);
  }
  
  return this;
};

Flag.prototype.matchesName = function (flagName) {
  
  var names = _.map(flatten(arguments), flag.addDashes);
  
  return this.internals.name.matches(names);
};

Flag.prototype.handler = function (fn) {
  
  if (arguments.length === 0) {
    return this.internals.handler;
  }
  
  this.internals.handler = fn.bind(this);
  
  return this;
};

Flag.prototype.async = function (val) {
  
  this.internals.async = (val !== false) ? true : false;
  
  return this;
};

Flag.prototype.isAsync = function () {
  
  return this.internals.async;
};

// TODO: move to help module
Flag.prototype.description = function (val) {
  
  if (arguments.length === 0) {
    return this.internals.description;
  }
  
  this.internals.description = val;
  
  return this;
};

// TODO: move to help module
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

// TODO: move to help module
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