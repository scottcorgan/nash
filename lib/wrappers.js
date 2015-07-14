var flatten = require('flat-arguments');
var async = require('async');
var asArray = require('as-array');

function lastIsCallback (values) {

  return typeof values[values.length - 1] === 'function';
}

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
  var values = asArray(arguments);

  // Async mode
  var done = lastIsCallback(values) ? values.pop() : function () {};

  // this._runAsync(values, done);
  async.eachSeries(this.all(), function (wrapperFns, wrapperFnsDone) {

    async.each(wrapperFns, function (fn, fnDone) {

      fn.apply(self, values.concat(fnDone));
    }, wrapperFnsDone);

  }, done);

  return this;
};
