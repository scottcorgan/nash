var _ = require('lodash');
var argsList = require('args-list');
var runBefore = require('./helpers/run-before');
var addBeforeMethods = require('./helpers/add-before-methods');

function Command (options) {
  this._before = options.before || [];
  this._flags = [];
  this._description = '(No description given)';
  this._handler = {
    args: [],
    fn: function (done) {done();}
  }
  this._tasks = {};
  this.cli = options.cli;
  
  this._aliasesWithUsage = options.aliases;
  this._aliases = _(options.aliases).map(function (alias) {
    return alias.split(' ')[0];
  }).value();
}

Command._rootAlias = function (alias) {
  return alias.toLowerCase().split(' ')[0];
};

Command.prototype.before = function () {
  this._before.concat(addBeforeMethods(this.cli.methods, arguments));
  return this;
};

Command.prototype.secret = function (isSecret) {
  this._secret = isSecret;
  return this;
};

Command.prototype.flags = function () {
  // TODO: parse these flags
  this._flags = _.toArray(arguments);
  return this;
};

Command.prototype.description = function (desc) {
  this._description = desc;
  return this;
};

Command.prototype.handler = function (fn) {
  var args = _.initial(argsList(fn));
  
  this._handler = {
    args: args,
    fn: fn
  };
  
  return this;
};

Command.prototype.task = function () {
  var aliases = _.toArray(arguments);
  var task = new Command({
    aliases: aliases,
    before: _.clone(this._before)
  });
  
  // Track our tasks
  _.each(aliases, function (alias) {
    this._tasks[alias] = task;
  }, this);
  
  return task;
};

Command.prototype.execute = function (args, callback) {
  var command = this;
  
  runBefore(this._before, command, function (err) {
    if (err) return callback(err);
    
    // supply default arguments based on fn signature
    if (args.length < command._handler.args.length) {
      args = args.concat(Array(command._handler.args.length - args.length));
    }
    
    args = removeExcessArgs(args);
    command._handler.fn.apply(command, args.concat(callback));
    
    // Handle too many arguments being passed to the command
    function removeExcessArgs (args) {
      if (args.length > command._handler.args.length) return removeExcessArgs(_.rest(args));
      return args;
    }
  });
  
};

Command.prototype.executeTask = function (task, args, callback) {
  this.getTask(task).execute(args, callback);
};

Command.prototype.getTask = function (alias) {
  if (!alias) return;
  
  return _.find(this._tasks, function (task, key) {
    return key.split(' ')[0].toLowerCase() === alias.toLowerCase();
  });
};

module.exports = Command;