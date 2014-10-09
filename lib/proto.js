var _ = require('lodash');
var minimist = require('minimist');
var asArray = require('as-array');

var defineCommand = require('./command');

var proto = module.exports = {
  _commands: []
};

proto.command = function () {
  
  var command = defineCommand(asArray(arguments));
  this._commands.push(command);
  
  return command;
};

proto.run = function (argv) {
  
  this.argv = minimist(asArray(argv).slice(2));
  var command = parseCommand(this.argv);
  
  
  
  // TODO:
  // how do we handle cli level flags vs
  // command level flags?
  
  
  
  
  // Figure out what to execute
  var commandToRun = 
    this.findCommandTask(command.name, command.task) ||
    this.findCommand(command.name, command.task) ||
    defineCommand.noop();
  
  // Order of operation
  // - 1. beforeAlls
  // - 2. flags
  // x 3. command tasks
  // x 4. command
  // - 5. afterAlls
  
  commandToRun.run(command.data, command.flags);
  
  return this;
};

proto.findCommand = function (commandName, taskName) {
  
  var commandToRun = _.find(this._commands, function (definedCommand) {
    
    return definedCommand.matchesName(commandName) && !taskName;
  });
  
  return commandToRun;
};

proto.findCommandTask = function (commandName, taskName) {
  
  var taskCommand = _.find(this._commands, function (definedCommand) {
    
    return definedCommand.matchesTask(commandName, taskName);
  });
  
  return (taskCommand) ? taskCommand.task(taskName) : undefined;
};

// Helper Methods

function parseCommand (args) {
  
  if (args._.length === 0) return {};
  
  var data = args._[0];
  
  return {
    name: commandName(data),
    task: taskName(data),
    data: commandData(args._),
    flags: commandFlags(args)
  };
}

function commandName (args) {
  
  return args.split(':')[0];
}

function taskName (args) {
  
 return args.split(':')[1]; 
}

function commandData (data) {
  
  return _.rest(data);
}

function commandFlags (args) {
  
  return _.omit(args, '_');
}