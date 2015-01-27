var _ = require('lodash');

module.exports = function (flagMap, allFlags) {
  
  _(flagMap)
    .keys()
    .each(function (flagName) {
      
      _(allFlags)
        .filter(function (flag) {
          
          return flag.matchesName(flagName);
        })
        .each(function (flag) {
        
          flag.runOnce(flagMap[flagName]);
        })
        .value();
    })
    .value();
};