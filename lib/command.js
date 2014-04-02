var _ = require('lodash');
var argsList = require('args-list');
var flatten = require('flat-arguments');

function Command (options) {
  this._before = options.before || [];
  this._flags = [];
  this._description = '(No description given)';
  this._handler = {
    args: [],
    fn: function (done) {done();}
  };
  this._tasks = {};
  this.cli = options.cli;
  
  this._aliasesWithUsage = options.aliases;
  this._aliases = _(options.aliases).map(function (alias) {
    return alias.split(' ')[0];
  }).value();
}

Command._rootAlias = function (alias) {
  return alias.split(' ')[0].toLowerCase();
};

Command.prototype.before = function () {
  // Add all items to "before" collection
  this._before = this._before.concat(flatten(arguments));
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
    
    // NOTE: do we inherit the "before" methods
    // from the parent?
    // before: _.clone(this._before),
    
    cli: this.cli
  });
  
  // Track our tasks
  _.each(aliases, function (alias) {
    this._tasks[alias] = task;
  }, this);
  
  return task;
};

Command.prototype.execute = function (args, callback) {
  var command = this;
  
  // FIXME: transition to Qmap
  
  this._before.forEach(function (bef) {
    this.cli.methods.push(bef);
  }, this);
  
  this.cli.methods.drain(this.cli, this, function (err) {
    if (err) return callback(err);
    
    // supply default arguments based on fn signature
    if (args.length < command._handler.args.length) {
      args = args.concat(Array(command._handler.args.length - args.length));
    }
    
    args = removeExcessArgs(args);
    
    command._handler.fn.apply(command, args.concat(callback));
    
    // Handle too many arguments being passed to the command
    function removeExcessArgs (args) {
      if (args.length > command._handler.args.length) return removeExcessArgs(_.initial(args));
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
    return Command._rootAlias(key) === alias.toLowerCase();
  });
};

module.exports = Command;