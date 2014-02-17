var _ = require('lodash');
var parse = require('./lib/parse');
var minimist = require('minimist');
var feedback = require('feedback');
var print = require('pretty-print');
var errors = require('./lib/errors');
var Command = require('./lib/command');
var Flag = require('./lib/flag');
var shortcut = require('./lib/shortcut');
var help = require('./lib/help');
var drainer = require('drainer');

var Nash = function (options) {
  this._commands = {};
  this._commandsWithCombinedAlias = {};
  this._flagsWithCombinedAlias = {};
  this._flags = {};
  this._before = [];
  this._beforeMethods = [];
  
  this.debug = (options.debug === undefined) ? true : options.debug;
  this.args = options.args;
  this.errors = errors;
  this.callback = options.callback || function () {};
  this.commands = {};
  this._beforeCommands = {};
  
  // overrides
  _.extend(this, options);
  
  // set up default help function
  help(this);
};

// Run the input as a cli command
Nash.prototype.run = function (argv) {
  var input = parse.input(minimist(argv.slice(2)));
  var command = this.getCommand(input.command);
  
  if (this._runFlags(input)) return; // Execute flags
  if (!command) return feedback.error('Invalid command'); // No command found or invalid command
  
  // exectute task
  if (input.task) {
    
    // TODO: handle beforeCommands with tasks to
    
    if (!command.isTask(input.task)) return feedback.error('Invalid command');
    command.executeTask(input.task, input.args, function (err) {
      if (err) return cli.error(err);
    });
  }
  else {
    command.execute(input.args, function (err) {
      if (err) cli.error(err);
    });
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
    aliases: commandAliases
  });
  
  // Track commands for help output
  this._commandsWithCombinedAlias[commandAliases.join(', ')] = command;
  
  // Track our commands
  _.each(commandAliases, function (alias) {
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
  return this._commands[alias];
};

Nash.prototype.log = function (msg, options) {
  var logger = 'info';
  
  if (options && options.success) logger = 'success';
  if (this._shouldDebug(options)) return feedback[logger](msg);
};

Nash.prototype.logObject = function (obj, options) {
  if (!obj) obj = {};
  if (this._shouldDebug(options)) print(obj, options);
};

Nash.prototype.error = function (msg) {
  if (this.debug) {
    feedback.error(msg);
    process.exit(1);
  }
};

Nash.prototype.beforeCommand = function (name, fn) {
  if (!fn) return this._beforeCommands[name];
  else this._beforeCommands[name] = fn;
};

Nash.prototype._shouldDebug = function (options) {
  return (this.debug || (options && options.debug))
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

Nash.createCli = function (options) {
  return new Nash(options);
};


module.exports = Nash;