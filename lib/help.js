var path = require('path');
var fs = require('fs');
var feedback = require('feedback');
var print = require('pretty-print');
var _ = require('lodash');
var format = require('chalk');

module.exports = function (cli) {
  
  // Default help command
  cli.command('help')
    .secret(true)
    .handler(function () {
      var write = writeWithPadding(this);
      
      intro();
      usage();
      commands();
      flags();
      
      function intro () {
        write();
        write((cli.color) ? format[cli.color](cli.title) : cli.title);
        write()
        write((cli.color) ? format[cli.color](cli.description) : cli.description);
      }
      
      function usage () {
        write();
        write((cli.color) ? format[cli.color]('Usage:') : 'Usage:');
        write();
        write('  ' + programName() + ' <command> <parameters> <options>');
      }
      
      function commands () {
        var cmds = {};
        
        write();
        write((cli.color) ? format[cli.color]('Commands:') : 'Commands:');
        write();
        
        _.each(cli._commandsWithCombinedAlias, function (cmd, key) {
          var cliCommand = cli._commandsWithCombinedAlias[key];
        
          // Only show commands that aren't set to hide
          if (!cliCommand._secret) cmds[key] = cliCommand._description;
        });
        
        print(cmds, {
          leftPadding: 4,
          rightPadding: 4
        });
      }
      
      function flags () {
        var flags = {};
        
        write();
        write((cli.color) ? format[cli.color]('Global Flags:') : 'Global Flags:')
        write();
        
        
        _.each(cli._flagsWithCombinedAlias, function (cmd, key) {
          var cliFlag = cli._flagsWithCombinedAlias[key];
          if (!cliFlag._secret) flags[key] = cliFlag._description;
        });
        
        print(flags, {
          leftPadding: 4,
          rightPadding: 4
        });
      }

      function writeWithPadding(command) {
        return function (data) {
          cli.log('  ' + (data || ''));
        };
      }
      
      function programName () {
        var appDir = path.dirname(module.parent.parent.filename);
        var name = '<program>';
        
        try{
          var pkg = require(appDir + '/package.json');
          var name = Object.keys(pkg.bin)[0];
        }
        catch(e) {}
        
        return name;
      }
    });

  // Default -h, --help flags
  cli.flag('-h', '--help')
    .description('display Divshot help and options')
    .exit(true)
    .handler(function () {
      cli.commands.help({debug: true});
    });
};

