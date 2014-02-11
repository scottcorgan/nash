var parse = {};

parse.input = function (argv) {
  return _commandOptions(_parseArgs(argv));
};

function _commandOptions (args) {
  var first = args.shift();
  var command = (first) ? first.split(':') : [];  
  var options = {
    command: command[0],
    args: args,
    debug: (args.debug !== undefined) ? args.debug : true // Allows app to print to stdout or not
  };

  if (command[1]) options.task = command[1];
  
  return options;
};

function _parseArgs (argv) {
  var args = argv._ || [];
  
  Object.keys(argv).forEach(function (arg) {
    if (arg === '_') return;
    args[arg] = argv[arg];
  });
  
  if (typeof args === 'string') args = [args];
  
  return args;
};

module.exports = parse;