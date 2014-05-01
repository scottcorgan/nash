var path = require('path');
var fs = require('fs');
var feedback = require('feedback');
var print = require('pretty-print');
var _ = require('lodash');
var format = require('chalk');
var sortObject = require('sorted-object');

var help = function (cli) {
  var write = writeWithPadding();
  
  // Default help command
  var helpCommand = cli.command('help')
    .secret(true)
    .handler(function () {
      var usage = cli._usage || programName(cli) + ' <command> <parameters> <options>';
      
      printIntro();
      printUsage('  ' + usage);
      printCommands();
      printOptions();
    });
  
  helpCommand.task('detail')
    .handler(function (cmd, done) {
      var command = cli.getCommand(cmd);
      var usageStr = '';
      
      // Command doens't exist
      if (!command) return cli._catchAll('command', cmd);
      
      // TODO: handle parameteres and options correctly
      _.each(command._aliasesWithUsage, function (alias, idx) {
        usageStr += '  ' + programName(cli) + ' ' + alias;
        if (idx < command._aliasesWithUsage.length - 1) usageStr += '\n  ';
      });
      
      write()
      write(format.bold(cmd) + ': ' + command._description);
      
      printUsage(usageStr);
      printTasks(command._tasks);
      printOptions();
    });

  // Default -h, --help flags
  cli.flag('-h', '--help')
    .description('display Divshot help and options')
    .exit(true)
    .handler(function () {
      cli.commands.help({debug: true});
    });
  
  function printIntro () {
    if (cli.title) {
      write();
      write((cli.color) ? format[cli.color](cli.title) : cli.title);
    }
    
    if (cli.description) {
      write()
      write((cli.color) ? format[cli.color](cli.description) : cli.description);
    }
  }

  function printUsage (commandUsage) {
    write();
    write((cli.color) ? format[cli.color]('Usage:') : 'Usage:');
    write();
    write(commandUsage);
  }

  function printCommands () {
    var cmds = {};
    
    _.each(sortObject(cli._commandsWithCombinedAlias), function (cmd, key) {
      var cliCommand = cli._commandsWithCombinedAlias[key];
    
      // Only show commands that aren't set to hide
      if (!cliCommand._secret) cmds[key] = cliCommand._description;
    });
    
    if (_.isEmpty(cmds)) return;
    
    write();
    write((cli.color) ? format[cli.color]('Commands:') : 'Commands:');
    write();
    
    print(cmds, {
      leftPadding: 4,
      rightPadding: 4
    });
  }
  
  function printTasks (tasks) {
    if (_.keys(tasks).length < 1) return;
    
    var taskList = {};
    var sortedTasks = sortObject(tasks);
    
    write();
    write((cli.color) ? format[cli.color]('Tasks:') : 'Tasks:');
    write();
    
    var taskList = _(sortedTasks)
      .keys()
      .map(function (key) {
        return ':' + key;
      })
      .zipObject(_(sortedTasks).map(function (task, key) {
        return task._description
      }).value()).value();
    
    print(taskList, {
      leftPadding: 4,
      rightPadding: 4
    });
  }

  function printOptions () {
    var flags = {};
    
    write();
    write((cli.color) ? format[cli.color]('Options:') : 'Options:')
    write();
    
    
    _.each(sortObject(cli._flagsWithCombinedAlias), function (cmd, key) {
      var cliFlag = cli._flagsWithCombinedAlias[key];
      if (!cliFlag._secret) flags[key] = cliFlag._description;
    });
    
    print(flags, {
      leftPadding: 4,
      rightPadding: 4
    });
  }

  function writeWithPadding() {
    return function (data) {
      cli.log('  ' + (data || ''));
    };
  }

  function programName (cli) {
    var appDir = path.dirname(module.parent.parent.filename);
    var name = cli._commandName || '<program>';
    
    try{
      var pkg = require(appDir + '/package.json');
      name = Object.keys(pkg.bin)[0];
    }
    catch(e) {}
    
    return name;
  }
};

help.forCommmand = function (input) {
  var help = false;
  var command;
  
  // program command help
  if (input.command && input.args.indexOf('help') > -1) {
    command = input.command;
    help = true;
  }
  
  // program apps -h
  if (input.command && input.args.h) {
    command = input.command;
    help = true;
  }
  
  // program command --help
  if (input.command && input.args.help) {
    command = input.command;
    help = true;
  }
  
  // program help command
  // NOT program help:detail command
  if (input.command === 'help' && !input.task && input.args.length > 0) {
    command = input.args[0];
    help = true;
  }
  
  // program -h command
  if (!input.command && input.args.h && input.args.h !== true) {
    command = input.args.h;
    help = true;
  }
  
  // program --help command
  if (!input.command && input.args.help && input.args.help !== true) {
    command = input.args.help;
    help = true;
  }
  
  return (help) ? command : false;
};

module.exports = help;