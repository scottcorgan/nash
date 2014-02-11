// var Divshot = require('divshot');
var feedback = require('feedback');
var _ = require('lodash');
var print = require('pretty-print');
var minimist = require('minimist');
var errors = require('./errors');
var Command = require('./command');
var Flag = require('./flag');
var shortcuts = require('./shortcuts');
var help = require('./help');

function Cli (options) {
  this._commands = {};
  this._commandsWithCombinedAlias = {};
  this._flagsWithCombinedAlias = {};
  this._flags = {};
  
  this.debug = options.debug;
  this.args = options.args;
  this.user = options.user;
  this.cwd = options.cwd;
  this.config = this.cwd.getConfig();
  this.errors = errors;
  this.callback = options.callback || function () {};
  this._beforeCommands = {};
  
  // Set up default help function
  help(this);
};

Cli.prototype.command = function () {
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


Cli.prototype.getCommand = function (alias) {
  return this._commands[alias];
};

Cli.prototype.log = function (msg, options) {
  var logger = 'info';
  
  if (options && options.success) logger = 'success';
  if (this._shouldDebug(options)) return feedback[logger](msg);
};

Cli.prototype.logObject = function (obj, options) {
  if (!obj) obj = {};
  if (this._shouldDebug(options)) print(obj, options);
};

Cli.prototype.error = function (msg) {
  if (this.debug) {
    feedback.error(msg);
    process.exit(1);
  }
};

Cli.prototype.beforeCommand = function (name, fn) {
  if (!fn) return this._beforeCommands[name];
  else this._beforeCommands[name] = fn;
};

Cli.prototype.generateShortcuts = function () {
  this.commands = shortcuts(this);
  return this.commands;
};

Cli.prototype._shouldDebug = function (options) {
  return (this.debug || (options && options.debug))
};

Cli.prototype.flag = function () {
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

Cli.prototype.executeFlag = function (flag) {
  if (!this._flags[flag]) return;
  this._flags[flag].fn(this);
  return this._flags[flag].options;
};

module.exports = Cli;