var _ = require('lodash');
var flatten = require('flat-arguments');
var defineFlag = require('./flag');

var exports = module.exports = function () {
  
  return new Flags(arguments);
};

var Flags = exports.Instance = function () {
  
  this.internals = {
    all: flatten(arguments)
  };
};

Flags.prototype.all = function () {
  
  return this.internals.all;
};

Flags.prototype.add = function () {
  
  // Parse names of given flags
  var names = _(arguments)
    .flatten()
    .map(function (flg) {
      return flg.name();
    })
    .flatten()
    .value();
  
  // Test for unique flag
  var flg = this.findByName(names);
  
  // Flag exists in collection
  // Add any names that aren't part of the current flag
  if (flg) {
    flg.internals.name.add(names);
  }
  
  // Flag doesn't exist in collection
  if (!flg) {
    this.internals.all = this.internals.all.concat(flatten(arguments));
  }
  
  return this;
};

Flags.prototype.findByName = function () {
  
  var names = flatten(arguments);
  
  return _.find(this.all(), function (flag) {
    
    return flag.matchesName(names);
  });
};

Flags.prototype.async = function (val) {
  
  this.internals.async = (val !== false) ? true : false;
  _.each(this.all(), function (flag) {
    flag.async(val);
  });
  
  return this;
};

Flags.prototype.isAsync = function () {
  
  return this.internals.async;
};