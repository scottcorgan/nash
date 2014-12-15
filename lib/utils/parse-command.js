var _ = require('lodash');

module.exports = function parseCommand (args) {
  
  var data = args._[0];
  
  return {
    name: commandName(data),
    task: taskName(data),
    data: commandData(args._),
    flags: commandFlags(args)
  };
};

function commandName (args) {
  
  // This could happen when trying to run a default command
  // with or without a flag
  if (!args) {
    return;
  }
  
  return args.split(':')[0];
}

function taskName (args) {
  
  if (!args) {
    return;
  }
  
  return args.split(':')[1]; 
}

function commandData (data) {
  
  return _.rest(data);
}

function commandFlags (args) {
  
  return _.omit(args, '_');
}