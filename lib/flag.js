var EventEmitter = require('events').EventEmitter;

var flatten = require('flat-arguments');
var assign = require('object-assign');
var asArray = require('as-array');

var name = require('./name');

var flag = module.exports = function () {

  // TODO: test command decorators individually
  flag.decorators.forEach(function (decorator) {

    Flag.prototype[decorator.name] = decorator.handler;
  });

  // Also ensure that the name is always an array
  // This gives us the ability to have multiple names/aliases
  return new Flag(arguments);
};

flag.decorators = [];

flag.prefix = function (flagName) {

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

flag.unprefix = function (flagName) {

  // --flag
  if (flagName.slice(0, 2) === '--') {
    return flagName.slice(2);
  }

  // -f
  if (flagName.slice(0, 1) === '-') {
    return flagName.slice(1);
  }

  return flagName;
};

function Flag () {

  this.internals = {
    name: name(arguments),
    ran: false,
    handler: function (val, done) {

      done();
    }
  };

  assign(this, EventEmitter.prototype);
}

Flag.prototype.run = function (data, done) {

  done = done || function () {};

  var self = this;

  function runDone () {

    self.internals.ran = true;
    done();
  }

  this.internals.handler(data, runDone);

  return this;
};

Flag.prototype.runOnce = function () {

  if (!this.internals.ran) {
    this.run.apply(this, arguments);
  }
  else {
    // Already ran. Just finish.
    var arr = asArray(arguments);
    arr[arr.length - 1]();
  }

  return this;
};

Flag.prototype.matchesName = function () {

  var names = flatten(arguments).map(flag.prefix);

  return this.internals.name.matches(names);
};

Flag.prototype.handler = function (fn) {

  if (arguments.length === 0) {
    return this.internals.handler;
  }

  this.internals.handler = fn.bind(this);

  return this;
};

Flag.prototype.shouldOverride = function () {

  return this.internals.override;
};

Flag.prototype.override = function (val) {

  this.internals.override = (val !== false) ? true : false; // Is true if no value

  return this;
};

Flag.prototype.name = function (val) {

  if (arguments.length === 0) {
    return this.internals.name.all();
  }

  this.internals.name.add(val);

  return this;
};
