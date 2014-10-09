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
  
  this.argv = minimist(argv.slice(2));
  var command = parseCommand(this.argv);
  
  // Figure out what to execute
  var commandToRun = 
    this.findCommandTask(command) ||
    this.findCommand(command) ||
    defineCommand.noop();
  
  // Order of operation
  // 1. beforeAlls
  // 2. flags
  // 3. command tasks
  // 4. command
  // 5. afterAlls
  
  commandToRun.run(command.data);
  
  return this;
};

proto.findCommand = function (command) {
  
  var commandToRun = _.find(this._commands, function (definedCommand) {
    
    return definedCommand.matchesName(command.name);
  });
  
  return commandToRun;
};

proto.findCommandTask = function (command) {
  
  var taskCommand = _.find(this._commands, function (definedCommand) {
    
    return definedCommand.matchesTask(command.name, command.task);
  });
  
  return (taskCommand) ? taskCommand.task(command.task) : undefined;
};

// Helper Methods

function parseCommand (args) {
  
  if (args._.length === 0) return {};
  
  var data = args._[0];
  
  return {
    name: commandName(data),
    task: taskName(data),
    data: commandData(args._)
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





// // Run the input as a cli command
// Nash.prototype.run = function (argv) {
//   var cli = this;
//   var input = this.args = parse.input(minimist(argv.slice(2)));
  
//   var command = this.getCommand(input.command);
//   var helpWithCommand = help.forCommmand(input)

//   if (helpWithCommand) {
//     var command = cli.getCommand('help');
//     input.task = 'detail';
//     input.command = 'help';
//     input.args[0] = helpWithCommand;
//   }

//   if (!helpWithCommand && this._runFlags(input)) return; // Execute flags
//   if (!command) return this._catchAll('command', input.command); // No command found or invalid command
//   if (input.task && !command.getTask(input.task)) return this._catchAll('task', input.task);
  
//   if (input.task) command.executeTask(input.task, input.args, executionComplete);
//   else command.execute(input.args, executionComplete);
  
  
//   // FIXME: need to run all "beforeAll methods first here
//   // then run the "before" methods per command/task
  
//   // this.methods.drain(this, command, function (err) {
//   //   if (err) return executionComplete(err);
    
//   //   // exectute task
//   //   if (input.task) command.executeTask(input.task, input.args, executionComplete);
//   //   else command.execute(input.args, executionComplete);
//   // });
  
//   function executionComplete (err) {
//     if (err) cli.error(err);
//   }
// };