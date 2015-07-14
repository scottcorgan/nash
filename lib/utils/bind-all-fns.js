var asArray = require('as-array');

module.exports = function bindAllFunctionsTo (ctx, fns) {

  return asArray(fns).map(function (fn) {

    return fn.bind(ctx);
  });
};
