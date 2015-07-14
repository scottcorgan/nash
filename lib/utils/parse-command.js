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

  return data.slice(1);
}

function commandFlags (args) {

  delete args._;
  return args;
}

module.exports = function parseCommand (args) {

  var data = args._[0];

  return {
    name: commandName(data),
    task: taskName(data),
    data: commandData(args._),
    flags: commandFlags(args)
  };
};
