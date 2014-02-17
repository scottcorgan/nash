var _ = require('lodash');
var shortcuts = {};

module.exports = function (cli, command) {
  return handler(cli, command);
};

function handler (cli, command) {
  return function () {
    var originalCallback;
    var debug;
    var args = _.toArray(arguments);
    
    if (typeof args[args.length - 1] === 'object') debug = args.pop();
    
    originalCallback = args.pop() || function () {}; // Track the original callback
    
    cli.debug = !!debug; // Don't output to stdout
    
    // Turn stdout back on
    args.push(function () {
      cli.debug = true;
      originalCallback.apply(null, _.toArray(arguments));
    });
    
    command._handler.fn.apply(command, args);
  };
}