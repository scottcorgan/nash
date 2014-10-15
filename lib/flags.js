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
  
  this.internals.all = this.internals.all.concat(flatten(arguments));
  
  return this;
};

Flags.prototype.findByName = function () {
  
  var names = flatten(arguments);
  
  return _.find(this.all(), function (flag) {
    
    return flag.matchesName(names);
  });
};