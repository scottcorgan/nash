var _ = require('lodash');
var flatten = require('flat-arguments');
var async = require('async');

function lastIsCallback (values) {

  return _.isFunction(_.last(values));
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
  var values = _.toArray(arguments);

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
