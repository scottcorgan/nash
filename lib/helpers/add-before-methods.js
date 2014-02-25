var _ = require('lodash');

module.exports = function (methods, args) {
  return _(arguments)
    .toArray()
    .flatten()
    .map(function (fn) {
      if (_.isFunction(fn)) return fn;
      
      var method = methods[fn];
      if (method) return method;
      
      // No method found. Avoid error by
      // using generic callback function
      return function (command, done) {
        done();
      };
    })
    .value();
};