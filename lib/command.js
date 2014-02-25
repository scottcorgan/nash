var _ = require('lodash');
var argsList = require('args-list');
var drainer = require('drainer');

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

Command.prototype.before = function () {
  _(arguments)
    .toArray()
    .flatten()
    .map(function (fn) {
      if (_.isFunction(fn)) return fn;
      
      var method = this.cli.methods[fn];
      if (method) return method;
      
      // No method found. Avoid error by
      // using generic callback function
      return function (command, done) {done();};
    }, this)
    .each(function (fn) {
      this._before.push(fn);
    }, this);
  
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
  var drain = drainer(this._before);
  
  // Handle before functions
  drain(command, function (err) {
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
  this._tasks[task].execute(args, callback);
};

Command.prototype.isTask = function (task) {
  return !!this._tasks[task];
};

module.exports = Command;