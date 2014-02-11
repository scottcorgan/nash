var _ = require('lodash');
var Cli = require('./lib/cli');
var parse = require('./lib/parse');
var minimist = require('minimist');
var feedback = require('feedback');
var print = require('pretty-print');
var errors = require('./lib/errors');
var Command = require('./lib/command');
var Flag = require('./lib/flag');
var shortcuts = require('./lib/shortcuts');
var help = require('./lib/help');

var Nash = function (options) {
  var nash = this;
  
  this._commands = {};
  this._commandsWithCombinedAlias = {};
  this._flagsWithCombinedAlias = {};
  this._flags = {};
  this._before = [];
  
  this.debug = options.debug;
  this.args = options.args;
  this.errors = errors;
  this.callback = options.callback || function () {};
  this._beforeCommands = {};
  
  // overrides
  _.extend(this, options);
  
  // set up default help function
  // help(this);
  
  process.nextTick(function () {
    input = parse.input(minimist(options.argv.slice(2)));
    
    var command = nash.getCommand(input.command);
    
    if (!command) return feedback.error('Invalid command');
    
    // exectute task
    if (input.task) {
      
      // TODO: handle beforeCommands with tasks to
      
      if (!command.isTask(input.task)) return feedback.error('Invalid command');
      command.executeTask(input.task, input.args, function (err) {
        if (err) return cli.error(err);
        // callback.apply(null, _.toArray(arguments));
        
      });
      
     return
    }
    else {
      // Handle before functions
      // var drain = drainer(_.map(command._before, cli.beforeCommand, cli));
      
      // drain(nash, command, function (err) {
        // if (err) return cli.error(err);
        
        command.execute(input.args, function (err) {
          if (err) cli.error(err);
          // callback.apply(null, _.toArray(arguments));
        });
      // });
    }
    
    // cli.generateShortcuts();
    
  });
};

Nash.prototype.command = function () {
  var aliases = _.toArray(arguments);
  var command = new Command({
    aliases: aliases
  });
  
  // Track commands for help output
  this._commandsWithCombinedAlias[aliases.join(', ')] = command;
  
  // Track our commands
  aliases.forEach(function (alias) {
    this._commands[alias] = command;
  }, this);
  
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

Nash.prototype.generateShortcuts = function () {
  this.commands = shortcuts(this);
  return this.commands;
};

Nash.prototype._shouldDebug = function (options) {
  return (this.debug || (options && options.debug))
};

// Nash.prototype.flag = function () {
//   var aliases = _.rest(_.keys(minimist(_.toArray(arguments))));
//   var flag = new Flag({
//     aliases: aliases
//   });
  
//   this._flagsWithCombinedAlias[_.toArray(arguments).join(', ')] = flag;
  
//   // Track the flag
//   aliases.forEach(function (alias) {
//     this._flags[alias] = flag;
//   }, this);
  
//   return flag
// };

// Nash.prototype.executeFlag = function (flag) {
//   if (!this._flags[flag]) return;
//   this._flags[flag].fn(this);
//   return this._flags[flag].options;
// };

Nash.createCli = function (options) {
  return new Nash(options);
};


module.exports = Nash;