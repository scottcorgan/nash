var _ = require('lodash');
var flatten = require('flat-arguments');

var exports = module.exports = function (options) {
  
  return new Wrappers(options);
};

// NOTES:
// if one function is added, it runs in series
// if multiple functions are added all at once, it runs those ones in parallel
// handles arrays or arguments for list of functions

var Wrappers = exports.Instance = function (options) {
  
  this.internals = {
    options: options || {},
    all: []
  };
};

Wrappers.prototype.all = function () {
  
  return this.internals.all;
};

Wrappers.prototype.add = function () {
  
  var fns = flatten(arguments);
  
  this.internals.all.push(fns);
  
  return this;
};

Wrappers.prototype.run = function () {
  
  var self = this;
  var values = flatten(arguments);
  
  _.each(this.all(), function (fns) {
    
    _.each(fns, function (fn) {
      
      fn.apply(self, values);
    });
  });
};