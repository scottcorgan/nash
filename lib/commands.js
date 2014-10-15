var _ = require('lodash');
var flatten = require('flat-arguments');
var defineCommand = require('./command');

var exports = module.exports = function () {
  
  return new Commands(arguments);
};

var Commands = exports.Instance = function () {
  
  this.internals = {
    all: flatten(arguments)
  };
};

Commands.prototype.all = function () {
  
  return this.internals.all;
};

Commands.prototype.add = function () {
  
  var names = _(arguments)
    .flatten()
    .map(function (cmd) {
      return cmd.name();
    })
    .flatten()
    .value();
  
  // Test for unique command  
  var cmd = this.findByName(names);
  
  // Add any names that aren't part of the current command
  if (cmd) {
    cmd.internals.name.add(names);
  }
  
  if (!cmd) {
    this.internals.all = this.internals.all.concat(flatten(arguments));
  }
  
  return this;
};

Commands.prototype.findByName = function () {
  
  var names = flatten(arguments);
  
  return _.find(this.all(), function (cmd) {
    
    return cmd.matchesName(names);
  });
};