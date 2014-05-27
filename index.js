var _ = require('lodash');
var parse = require('./lib/parse');
var minimist = require('minimist');
var feedback = require('feedback');
var print = require('pretty-print');
var Qmap = require('qmap');
var errors = require('./lib/errors');
var Command = require('./lib/command');
var Flag = require('./lib/flag');
var shortcut = require('./lib/shortcut');
var help = require('./lib/help');
var EventEmitter = require('events').EventEmitter;
var util = require('util');

var Nash = function (options) {
  options = options || {};

  this._commands = {};
  this._commandsWithCombinedAlias = {};
  this._flagsWithCombinedAlias = {};
  this._flags = {};
  this.methods = new Qmap();
  this._catchAll = function () {};
  this._commandName = options.commandName;

  this.debug = (options.debug === undefined) ? true : options.debug;
  this.args = options.args;
  this.errors = errors;
  this.callback = options.callback || function () {};
  this.commands = {};

  // overrides
  _.extend(this, options);

  // set up default help function
  help(this);
  
  // Call parent constructor
  EventEmitter.call(this);
};

util.inherits(Nash, EventEmitter);

// Run the input as a cli command
Nash.prototype.run = function (argv) {
  var cli = this;
  var input = this.args = parse.input(minimist(argv.slice(2)));
  
  var command = this.getCommand(input.command);
  var helpWithCommand = help.forCommmand(input)

  if (helpWithCommand) {
    var command = cli.getCommand('help');
    input.task = 'detail';
    input.command = 'help';
    input.args[0] = helpWithCommand;
  }

  if (!helpWithCommand && this._runFlags(input)) return; // Execute flags
  if (!command) return this._catchAll('command', input.command); // No command found or invalid command
  if (input.task && !command.getTask(input.task)) return this._catchAll('task', input.task);
  
  if (input.task) command.executeTask(input.task, input.args, executionComplete);
  else command.execute(input.args, executionComplete);
  
  
  // FIXME: need to run all "beforeAll methods first here
  // then run the "before" methods per command/task
  
  // this.methods.drain(this, command, function (err) {
  //   if (err) return executionComplete(err);
    
  //   // exectute task
  //   if (input.task) command.executeTask(input.task, input.args, executionComplete);
  //   else command.execute(input.args, executionComplete);
  // });
  
  function executionComplete (err) {
    if (err) cli.error(err);
  }
};

Nash.prototype._runFlags = function (input) {
  try{
    var exit = false;
    var flags = Object.keys(input.args);

    _.each(flags, function (flagName) {
      var flag = this._flags[flagName];
      if (flag) {
        flag.execute(input.args[flagName]);
        if (flag._exit) exit = true;
      }
    }, this);
  }
  finally {
    return exit;
  }
};

// Command creator
Nash.prototype.command = function () {
  var cli = this;
  var commandAliases = _.toArray(arguments);
  var command = new Command({
    aliases: commandAliases,
    cli: this
  });

  // Track commands for help output
  this._commandsWithCombinedAlias[command._aliases.join(', ')] = command;

  // Track our commands
  _.each(commandAliases, function (alias) {
    alias = Command._rootAlias(alias);
    this._commands[alias] = command; // add to command collection
    this.commands[alias] = shortcut(this, command); // create shortcut
  }, this);

  // Override task creation function so that
  // the task shortcut can be made
  var originalTaskFn = command.task;  //
  command.task = function () {
    var taskAliases = _.toArray(arguments);
    var task = originalTaskFn.apply(command, taskAliases);

    // Create shorcut for tasks
    _.each(commandAliases, function (commandAlias) {
      _.each(taskAliases, function (taskAlias) {
        cli.commands[commandAlias][taskAlias] = shortcut(cli, task);
      });
    });

    return task;
  };

  return command;
};

Nash.prototype.getCommand = function (alias) {
  if (!alias) return;

  return _.find(this._commands, function (command, key) {
    return Command._rootAlias(key) === alias.toLowerCase();
  });
};

Nash.prototype.log = function (msg, options) {
  var logger = 'info';

  if (options && options.success) logger = 'success';
  if (options && options.warning) logger = 'warn';
  
  if (!this._shouldDebug(options)) return;
  
  this.emit('data', msg);
  this.emit(logger, msg);
};

Nash.prototype.logObject = function (obj, options) {
  this.log(obj, options);
};

Nash.prototype.error = function (msg, options) {
  if (this._shouldDebug(options)) this.emit('error', msg);
};

Nash.prototype._shouldDebug = function (options) {
  return this.debug || (options && options.debug);
};

Nash.prototype.flag = function () {
  var aliases = _.rest(_.keys(minimist(_.toArray(arguments))));
  var flag = new Flag({
    aliases: aliases
  });

  this._flagsWithCombinedAlias[_.toArray(arguments).join(', ')] = flag;

  // Track the flag
  aliases.forEach(function (alias) {
    this._flags[alias] = flag;
  }, this);

  return flag
};

Nash.prototype.executeFlag = function (flag) {
  if (!this._flags[flag]) return;
  this._flags[flag].fn(this);
  return this._flags[flag].options;
};

Nash.prototype.method = function (name, fn) {
  this.methods.method(name, fn);
  return this;
};

Nash.prototype.usage = function (usage) {
  this._usage = usage;
  return this;
};

// Nash.prototype.beforeAll = function () {
//   this._beforeAll.concat(addBeforeMethods(this.methods, arguments))
//   return this;
// };

Nash.prototype.catchAll = function (fn) {
  this._catchAll = fn;
};

//
Nash.createCli = function (options) {
  return new Nash(options);
};


module.exports = Nash;
