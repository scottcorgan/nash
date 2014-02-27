var _ = require('lodash');
var shortcuts = {};

module.exports = function (cli, command) {
  return handler(cli, command);
};

function handler (cli, command) {
  return function () {
    var originalCallback;
    var debug = false;
    var args = _.toArray(arguments);
    
    // Last argument can be used for options
    // Remove it if it is
    if(_.isPlainObject(_.last(args))) debug = args.pop();
    else if (_.isBoolean(_.last(args))) debug = args.pop();
    
    // Track the original callback
    originalCallback = args.pop() || function () {};
    // Don't output to stdout
    cli.debug = !!debug; 
    
    // Wrapping the callback so that we can argument
    // the debug flag
    command.execute(args, function () {
      cli.debug = true;
      originalCallback.apply(null, _.toArray(arguments));
    });
  };
}