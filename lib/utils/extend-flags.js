var _ = require('lodash');

module.exports = function extendFlags (defaultFlags, flagOverrides) {

  if (!flagOverrides) {
    return defaultFlags;
  }

  var overrideFlagsWith = _.filter(flagOverrides, function (f) {

    return f.shouldOverride();
  });

  // Override default flags with command-specific flags
  _.each(overrideFlagsWith, function (flag) {

    var flagIndex = -1;
    _.find(defaultFlags, function (f, idx) {

      var matches = f.matchesName(flag.name());

      if (matches) {
        flagIndex = idx;
      }

      return matches;
    });

    // Found a matching flag to override
    if (flagIndex > -1) {
      defaultFlags[flagIndex] = flag;
    }
  });

  return defaultFlags;
};
