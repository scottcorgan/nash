var _ = require('lodash');
var async = require('async');

module.exports = function (flagMap, allFlags, runnerDone) {

  // NOTE: can these be parallel or only series?

  async.eachSeries(Object.keys(flagMap), function (flagName, keyDone) {

    var flags = _.filter(allFlags, function (flag) {

      return flag.matchesName(flagName);
    });

    async.eachSeries(flags, function (flag, flagDone) {

      flag.runOnce(flagMap[flagName], flagDone);
    }, keyDone);
  }, runnerDone);
};
