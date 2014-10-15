var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');
var minimist = require('minimist');
var asArray = require('as-array');
var flatten = require('flat-arguments');
var async = require('async');
var defineCommand = require('./command');
var commands = require('./commands');
var flags = require('./flags');
var defineFlag = require('./flag');
var mixin = _.extend;

var exports = module.exports = function createCli (options) {  
  return new Cli(options);
};

var Cli = exports.Cli = function (options) {
  
  this.options = options || {};
  this.internals = {
    commands: commands(),
    flags: flags(),
    // flags: [],
    beforeAlls: [],
    afterAlls:[],
    onInvalidCommand: function () {}
  };
  
  mixin(this, EventEmitter.prototype);
};


// Instantiators

Cli.prototype.command = function () {
  
  var names = flatten(arguments);
  var c = this.findCommand(names);
  var command = c || defineCommand(names);
  
  // Only add Command to the queue
  // if id didn't exist before
  if (!c) {
    // this.internals.commands.push(command);
    this.internals.commands.add(command);
  }
  
  return command;
};

Cli.prototype.flag = function () {
  
  var names = flatten(arguments);
  var f = this.findFlag(names);
  var flag = f || defineFlag(names);
  
  // Only add flag to the queue
  // if id didn't exist before
  if (!f) {
    this.internals.flags.add(flag);
  }
  
  return flag;
};

Cli.prototype.beforeAll = function (fn) {
  
  // TODO: allow any number of functions to be passed here
  
  this.internals.beforeAlls.push(fn.bind(this));
  
  return this;
};

Cli.prototype.afterAll = function (fn) {
  
  this.internals.afterAlls.push(fn.bind(this));
  
  return this;
};

Cli.prototype.onInvalidCommand = function (fn) {
  
  this.internals.onInvalidCommand = fn.bind(this);
  
  return this;
};

Cli.prototype.run = function (argv, runDone) {
  
  runDone = runDone || function () {};
  
  var self = this;
  this.argv = minimist(asArray(argv).slice(2));
  var command = parseCommand(this.argv);
  
  // Execute command, task, or nothing
  var commandToRun = 
    self.findCommandTask(command.name, command.task) ||
    self.findCommand(command.name);
  
  // TODO:
  // abstract out cli-command and cli-flag as modules?
  // abstract help menu to it's own module
  
  async.series({
    beforeAlls: function (done) {
      
      self.runBeforeAlls(command.data, command.flags, done);
    },
    flags: function (done) {
      
      var commandFlags;
      
      if (commandToRun) {
        commandFlags = commandToRun.internals.flags.all();
      }
      
      self.runFlags(command.flags, done, commandFlags);
    },
    command: function (done) {
      
      if (commandToRun) {
        commandToRun.run(command.data, command.flags, done);
      }
      else {
        self.internals.onInvalidCommand(command.name, command.data, command.flags, done);
      }
    },
    afterAlls: function (done) {
      
      self.runAfterAlls(command.data, command.flags, done);
    }
  }, runDone);
  
  return this;
};


// Runners

Cli.prototype.runFlags = function (flagMap, done, _commandFlags_) {
  
  var flags = extendFlags(this.internals.flags.all(), _commandFlags_);
  
  // Run flags from flag map
  _(flagMap)
    .keys()
    .each(function (flagName) {
      
      _(flags)
        .filter(function (flag) {
          
          return flag.matchesName(flagName);
        })
        .each(function (flag) {
        
          flag.runOnce(flagMap[flagName]);
        });
    });
  
  done();
};

Cli.prototype.runBeforeAlls = function (data, flags, done) {
  
  async.eachSeries(this.internals.beforeAlls, function (beforeFn, beforeFnDone) {
    
    beforeFn(data, flags, beforeFnDone);
  }, done);
};

Cli.prototype.runAfterAlls = function (data, flags, done) {
  
  async.eachSeries(this.internals.afterAlls, function (afterFn, afterFnDone) {
    
    afterFn(data, flags, afterFnDone);
  }, done);
};


// Finders

Cli.prototype.findCommand = function () {
  
  return this.internals.commands.findByName(arguments);
};

Cli.prototype.findCommandTask = function (commandName, taskName) {
  
  var cmd = this.findCommand(commandName);
  
  if (!cmd) {
    return;
  }
  
  return cmd.findTask(taskName);
};

Cli.prototype.findFlag = function () {
  
  return this.internals.flags.findByName(arguments);
};


// Helper Methods

function parseCommand (args) {
  
  if (args._.length === 0) return {};
  
  var data = args._[0];
  
  return {
    name: commandName(data),
    task: taskName(data),
    data: commandData(args._),
    flags: commandFlags(args)
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

function commandFlags (args) {
  
  return _.omit(args, '_');
}

function extendFlags (defaultFlags, flagOverrides) {
  
  if (!flagOverrides) {
    return defaultFlags;
  }
  
  var overrideFlagsWith = _.filter(flagOverrides, function (f) {
    
    return f.shouldOverride();
  });
  
  _.each(overrideFlagsWith, function (flag) {
    
    var flagIndex = -1;
    var matchingFlag = _.find(defaultFlags, function (f, idx) {
      
      var matches = f.matchesName(flag.name());
      
      if (matches) {
        flagIndex = idx;
      }
      
      return matches;
    });
    
    // Found a matching flag to override
    if (flagIndex > -1) {
      defaultFlags[flagIndex] = flag;
    }
  });
  
  return defaultFlags;
}