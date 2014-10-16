var _ = require('lodash');
var flatten = require('flat-arguments');
var async = require('async');

var exports = module.exports = function (options) {
  
  return new Wrappers(options);
};

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
  
  // Async mode
  if (this.internals.options.async) {    
    var done = lastIsCallback(values) ? values.pop() : function () {};
    this._runAsync(values, done);
  }
  
  // Non async mode
  else {
    this._runSync(values);
  }
  
  return this;
};

Wrappers.prototype._runSync = function (values) {
  
  var self = this;
  
  _.each(this.all(), function (fns) {
    
    _.each(fns, function (fn) {
      
      fn.apply(self, values);
    });
  });
};

Wrappers.prototype._runAsync = function (values, runAsyncDone) {
  
  var self = this;
  
  async.eachSeries(this.all(), function (wrapperFns, wrapperFnsDone) {
    
    async.each(wrapperFns, function (fn, fnDone) {
      
      fn.apply(self, values.concat(fnDone));
    }, wrapperFnsDone);
    
  }, runAsyncDone);
};

// Helpers

function lastIsCallback (values) {
  
  return _.isFunction(_.last(values));
}