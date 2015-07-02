var map = require('lodash').map;

module.exports = function bindAllFunctionsTo (ctx, fns) {

  return map(fns, function (fn) {

    return fn.bind(ctx);
  });
};
