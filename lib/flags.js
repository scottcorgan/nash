var flatten = require('flat-arguments');
var find = require('lodash.find');
var _flatten = require('lodash.flatten');
var async = require('async');

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

  var names = _flatten(arguments)
    .map(function (flg) {

      return _flatten(flg.name());
    });

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

  return find(this.all(), function (flag) {

    return flag.matchesName(names);
  });
};

Flags.prototype.run = function (flagMap, doneRunningFlags) {

  var flagsToRun = Object.keys(flagMap)
    .map(function (flagName) {

      var flag = this.findByName(flagName);

      if (flag) {
        return {
          instance: flag,
          args: flagMap[flagName]
        };
      }
    }, this)
    .filter(function (val) {

      return val;
    });

  async.each(flagsToRun, function (flag, flagDone) {

    flag.instance.runOnce(flag.args, flagDone);
  }, doneRunningFlags);
};
