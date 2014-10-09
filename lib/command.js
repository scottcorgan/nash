var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');
var async = require('async');
var flatten = require('flat-arguments');
var defineFlag = require('./flag');
var mixin = _.extend;

var defineCommand = module.exports = function (name) {
  
  // Also ensure that the name is always an array
  // This gives us the ability to have multiple names/aliases
  return new Command(flatten(arguments));
};

// helps avoid runtime errors with missing commands
defineCommand.noop = function () {
  
  return new Command();
};

// Command Class
function Command (name) {
  
  var defaults = {
    _name: name,
    _description: '',
    _usage: '',
    _hidden: false,
    _flags: [],
    _befores: [],
    _afters: [],
    _tasks: [],
    _handler: function () {}
  };
  
  mixin(this, defaults);
  mixin(this, EventEmitter.prototype);
}

Command.prototype.run = function (data, flagMap, done) {
  
  done = done || function () {};
  
  var command = this;
  
  // Execute all aspects of running a command
  async.series({
    befores: function (done) {
      
      command.runBefores(data, flagMap, done);
    },
    flags: function (done) {
      
      command.runFlags(flagMap);
      done();
    },
    handler: function (done) {
      
      command._handler.apply(command, data);
      done();
    },
    afters: function (done) {
      
      command.runAfters(data, flagMap, done);
    }
  }, done);
  
  return this;
};


// TODO: abstract into class "CommandWrappers"
// CommandWrappers.prototype.run() / etc.
// CommandWrappers.protoytpe.push()
Command.prototype.runBefores = function (data, flags, runBeforesDone) {
  
  async.eachSeries(this._befores, function (before, done) {
    
    before(data, flags, done);
  }, function (err) {
    
    if (err) {
      return runBeforesDone(err)
    }
    
    runBeforesDone();
  });
};

Command.prototype.runAfters = function (data, flags, runBeforesDone) {
  
  async.eachSeries(this._afters, function (before, done) {
    
    before(data, flags, done);
  }, function (err) {
    
    if (err) {
      return runBeforesDone(err)
    }
    
    runBeforesDone();
  });
};

Command.prototype.runFlags = function (flagMap) {
  
  _(flagMap).keys().each(function (flagName) {
      
    var f = (flagName.length === 1) ? '-' + flagName : '--' + flagName
    var flagsToRun = _.filter(this._flags, function (flag) {
      
      return flag.matchesName(f);
    });
    
    _.each(flagsToRun, function (flag) {
      
      flag.run(flagMap[flagName]);
    });
  }, this);
};

Command.prototype.matchesName = function (commandName) {
  
  return _.contains(this._name, commandName);
};

Command.prototype.matchesTask = function (commandName, taskName) {
  
  return this.matchesName(commandName)
    && _.find(this._tasks, function (definedTask) {
      
      return definedTask.matchesName(taskName);
    });
}

Command.prototype.handler = function (fn) {
  
  if (arguments.length === 0) {
    return this._handler;
  }
  
  this._handler = fn.bind(this);
  
  return this;
};

Command.prototype.task = function () {
  
  var name = flatten(arguments);
  var t = this.findTask.apply(this, name);
  var task = t || defineCommand(name);
  
  // Only add task to the queue
  // if id didn't exist before
  if (!t) {
    this._tasks.push(task);
  }
  
  // Remove ability for command tasks to create
  // sub tasks of themself. At least for now.
  task.task = undefined;
  
  return task;
};

Command.prototype.flag = function () {
  
  var name = flatten(arguments);
  var f = this.findFlag.apply(this, name);
  var flag = f || defineFlag(name);
  
  // Only add task to the queue
  // if id didn't exist before
  if (!f) {
    this._flags.push(flag);
  }
  
  return flag;
};

Command.prototype.findTask = function () {
  
  var names = flatten(arguments);
  var task;
  
  _.each(names, function (name) {
    
    task = _.find(this._tasks, function (t) {
      
      return t.matchesName(name);
    });
  }, this);
  
  return task;
};

Command.prototype.findFlag = function () {
  
  var names = flatten(arguments);
  var task;
  
  _.each(names, function (name) {
    
    flag = _.find(this._flags, function (f) {
      
      return f.matchesName(name);
    });
  }, this);
  
  return flag;
};

Command.prototype.name = function () {
  
  if (arguments.length === 0) {
    return this._name;
  }

  this._name.push(val);
  
  return this;
};

Command.prototype.hidden = function (val) {
  
  if (arguments.length === 0) {
    return this._hidden;
  }
  
  this._hidden = val;
  
  return this;
};

Command.prototype.before = function (fn) {
  
  if (!fn) {
    return this._befores;
  }
  
  this._befores.push(fn);
  
  return this;
};

Command.prototype.after = function (fn) {
  
  if (!fn) {
    return this._afters;
  }
  
  this._afters.push(fn);
  
  return this;
};

Command.prototype.description = function (val) {
  
  if (arguments.length === 0) {
    return this._description;
  }
  
  this._description = val;
  
  return this;
};

Command.prototype.usage = function (val) {
  
  if (arguments.length === 0) {
    return this._usage;
  }
  
  this._usage = val;
  
  return this;
};