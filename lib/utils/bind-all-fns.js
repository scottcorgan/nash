var _ = require('lodash');

module.exports = function bindAllFunctionsTo (ctx, fns) {
  
  return _(fns)
    .map(function (fn) {
      
      return fn.bind(ctx);
    })
    .value();
};