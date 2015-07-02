var _ = require('lodash');
var flatten = require('flat-arguments');

var exports = module.exports = function () {

  return new Commands(arguments);
};

var Commands = exports.Instance = function () {

  this.internals = {
    all: flatten(arguments)
  };
};

Commands.prototype.all = function () {

  return this.internals.all;
};

Commands.prototype.add = function () {

  var names = _(arguments)
    .flatten()
    .map(function (cmd) {
      return cmd.name();
    })
    .flatten()
    .value();

  // Test for unique command
  var cmd = this.findByName(names);

  // Command exists in collection
  // Add any names that aren't part of the current command
  if (cmd) {
    cmd.internals.name.add(names);
  }

  // Command doesn't exist in collection
  if (!cmd) {
    this.internals.all = this.internals.all.concat(flatten(arguments));
  }

  return this;
};

Commands.prototype.findByName = function () {

  var names = flatten(arguments);

  return _.find(this.all(), function (cmd) {

    return cmd.matchesName(names);
  });
};

Commands.prototype.run = function (command, commandRunDone) {

  if (!command.name) {
    return commandRunDone(new Error('Command not Found'));
  }

  var commandName = command.name;
  var taskName = command.task;

  var cmd = this.findByName(commandName);


  if (!cmd) {
    return commandRunDone(new Error('Command not found'));
  }

  // Execute command or task
  cmd = cmd.findTask(taskName) || cmd;

  // Run command with data and flags
  cmd.run(command.data, command.flags, commandRunDone);
};
