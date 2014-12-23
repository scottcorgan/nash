# nash [![Gitter](https://badges.gitter.im/Join Chat.svg)](https://gitter.im/scottcorgan/nash?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge) [ ![Codeship Status for scottcorgan/nash](https://codeship.com/projects/63cd73f0-528e-0132-350c-1e034fd16c6e/status)](https://codeship.com/projects/48678)

Craft command-line masterpieces

**API**

* [Cli](#cli)
  * [run](#runargv)
  * [command](#commandname-names-)
  * [default](#defaultcallback)
  * [flag](#flagname-names-)
  * [beforeAll](#beforeallcallback-callback-)
  * [afterAll](#afterallcallback-callback-)
  * [onInvalidCommand](#oninvalidcommandcallback)
  * [set](#setname-value)
  * [get](#getname)
  * [register](#registerplugin-options)
* [Command](#command)
  * [handler](#handlercallback)
  * [task](#taskname-name-)
  * [flag](#flagname-name-)
  * [async](#async)
  * [before](#beforecallback-callback-)
  * [after](#aftercallback-callback-)
  * [name](#namename-name-)
  * [deprecate](#deprecatemessage)
  * [deprecateShouldExit](#deprecatedshouldexit)
* [Flag](#flag)
  * [handler](#handlercallback-1)
  * [exit](#exit)
  * [async](#async-1)
  * [override](#override)
  * [name](#namename-name--1)
* [Plugins](#plugins)

## Install

```
npm install nash --save
```

## Usage

```js
var nash = require('nash');
var cli = nash();

cli.beforeAll(function () {
  
  // Run this before all commands
});

cli.flag('-p')
  .handler(function () {
    
    // Do something when this flag is triggered
  });

cli.command('list')
  .handler(function () {
    
    // Do something here
  });

cli.command('async-command')
  .async()
  .handler(function (data, done) {
    
    // If do some async stuff;
    
    done();
  });

cli.run(process.argv);
```

## Cli

### run(argv)

Run the cli app with the given arguments. Normally you'd pass in `process.argv`.

```js
var nash = require('nash');
var cli = nash();

cli.command('some-command')
  .handler(function () {
  
		console.log('Some Command');
  });
  
cli.run(process.argv);
```

### command(name[, names, ...])

Create a command with the given name(s). Supports a single name, and array of names, or multiple names separated by commas as arguments to the command method. Returns an instance of [`Command`](#command).

```js
var nash = require('nash');
var cli = nash();

cli.command('some-command')
  .handler(function () {
  	
    // Do something here
  });
```

### default(callback)

Declare a default command to run if no command is provided. This is useful for small cli apps that have no commands and do only one task. This inherits the same api as a normal command.

```js
var nash = require('nash');
var cli = nash();

cli.default()
  .handler(function (flags) {
  
    // Do stuff here
  });

cli.run([]);
```

### flag(name[, names, ...])

Create a flag with the given name(s). Supports a single name, and array of names, or multiple names separated by commas as arguments to the command method. Returns an instance of [`Flag`](#flag).

```js
var nash = require('nash');
var cli = nash();

cli.flag('-f')
	.handler(function (value) {
  
  	// Do something with this flag value
	});
```

### beforeAll(callback[, callback, ...])

Add a function or functions to be called before any commands or flags are run. The callback is passed to arguments":

* `data` - the values passed in from the the terminal. 
* `flags` - a key/value map of flags and their corresponding values

```js
var nash = require('nash');
var cli = nash();

cli.beforeAll(function (data, flags) {

  // data === ['value']
  // flags === {f: 'flag-value'}
});

cli.command('some-command')
	.handler(function () {})
  .flag('-f')
  	.handler(function () {});

// This is usually sent in via process.argv
cli.run(['', '', 'some-command', 'value', '-f', 'flag-value']); 


```

### afterAll(callback[, callback, ...])

Does the same thing as `beforeAll()`, except runs the callbacks after all the commands and flags are run.

### onInvalidCommand(callback)

Callback gets called if no matching commands are found. This is useful to show error or help messages, and also to provide a catch-all command. The callback receives 3 parameters

* `commandName` - the name of the command that was attemped
* `data` - values passed in with the command
* `flags` - a key/value map of flags and their corresponding values

```js
var nash = require('nash');
var cli = nash();

cli.onInvalidCommand(function (commandName, data, flags) {

	// data === ['value']
  // flags === {f: 'flag-value'}
});

// This is usually sent in via process.argv
cli.run(['', '', 'some-command', 'value', '-f', 'flag-value']);
```

### set(name, value)

Cli-level/app-level settings. Set the given `name` to the given `value

* `name` - name of key
* `value` - value of name

### get(name)

Cli-level/app-level getter for settings.

* `name` - name of key to get

### register(plugin[, options])

Register a plugin with your command-line application. This provides extensibility and modularity. See [Plugins](#plugins) for more information.

## Command

Running `cli.command('name')` creates an instance of the Command class with following methods available:

### handler(callback)

The callback gets executed when the command is called. Any values passed in to the run method on the cli get passed into the callback. If the command is in async mode, the last parameter passed to the callback is the function to call when you're done.

```js
var nash = require('nash');
var cli = nash();


// Sync mode
cli.command('some-command')
  .handler(function (value) {

    // value === 'value'
  });

// Async mode
cli.command('async-command')
	.async()
  .handler(function (value, done) {
  	
    done();
  });

// Usually passed process.argv
cli.run(['', '', 'some-command', 'value']);

```

### task(name[, name, ...])

Creates a sub task of the command. This is similar to the command tasks that the Heroku toolbelt has. This creates a command that looks like `command:task` when running. Calling `task()` returns and instance of [`Command`](#command).

```js
var nash = require('nash');
var cli = nash();

cli.command('command')
  .task('task', 'tsk')
  .handler(function () {
  	
    // Do something here
  });
  
cli.run(['', '', 'command:task']);
```

### flag(name[, name, ...])

Creates a command-specific flag that only runs for that command. Returns an instance of [`Flag`](#flag).

```js
var nash = require('nash');
var cli = nash();

cli.command('command')
  .flag('-f', '--flag')
  .handler(function (value) {
  
  	// Do something here
  });

cli.run(['', '', 'command', '-f']);
```

### async()

Puts the command in async mode. If the command is in async mode, the last argument passed to the handler callback is the function to call when you're done. If no value is passed into the method, it is assumed to be true. You can also pass in `false` to the method to turn off async mode.

```js
var nash = require('nash');
var cli = nash();

cli.command('command');
  .async()
  .handler(function (done) {
  	
    done();
  });

cli.run(['', '', 'command']);
```

### before(callback[, callback, ...])

Add a function or functions to be called before the command and the command's flags are run. This has the same callback signature as Cli's [`beforeAll()`](#beforeallcallback-callback-)

### after(callback[, callback, ...])

This is the same as the `before()` method, except this is called after the command and all it's flags run.

### name(name[, name, ...])

Add more names to the command. Helpful if you want aliases or mispellings to trigger the command.


```js
var nash = require('nash');
var cli = nash();

cli.command('command')
  .name('cmd', 'commnd')
```

### deprecate(message)

Sets a command as deprecated. Pass in a message and the cli emits an event `warning` with the message.

```js
var nash = require('nash');
var cli = nash();

cli.command('command')
  .deprecate('Do not use this anymore');

cli.on('warning', function (msg) {
	console.log('Warning: ' + msg);
});

cli.run(['', '', 'command']);
```

### deprecatedShouldExit()

If no value or a value of `true` is passed in, the command won't run and the program will exit after it emits the deprecation warning.

## Flag

Running `cli.flag('name')` or `cli.command('name').flag('name')` creates an instance of the Flag class. If created under a command, the flag only runs with that command. The Flag class has the following methods available:

### handler(callback)

The callback gets executed when the flag is called. Any values passed in to the run method on the cli get passed into the callback. If the flag is in async mode, the last parameter passed to the callback is the function to call when you're done.

```js
var nash = require('nash');
var cli = nash();


// Sync mode
cli.command('some-command')
  .flag('-f')
  .handler(function () {
  
  	// Do something here
  });

// Async mode
cli.command('async-command')
	.flag('-f')
  .async()
  .handler(function (done) {
  
  	// Do something here
    done();
  });


// Usually passed process.argv
cli.run(['', '', 'some-command', '-f']);

```

### exit()

If no value or a value of `true` is passed in, the program will exit after the flag runs.

### async()

If no value or a value of `true` is passed in, the flag will be set to async mode and will receive a callback as the last paraemter to be called when done.

### override()

If no value or a value of `true` is passed in, this command specific flag will override the cli/global flag. If set to `false` or not called, the flag will run in series after the cli/global flag.

```js
var nash = require('nash');
var cli = nash();


cli.flag('-f')
	.handler(function () {
  
  });

cli.command('some-command')
  .flag('-f')
  .override()
  .handler(function () {
  
  	// Only this flag runs for -f
  });
  
cli.run(['', '', 'some-command', '-f']);
```

### name(name[, name, ...])

Add more names to the flag. Helpful if you want aliases or mispellings to trigger the flag.


```js
var nash = require('nash');
var cli = nash();

cli.command('command')
	.flag('-f')
	  .name('--flag', '--flaggling');
```

## Plugins

Nash lets you register plugins via the [`register`](#registerplugin-options) method on the cli object. This makes it easier to break up your command-line app as it grows.

**Example of registering a plugin:**

```js
var nash = require('nash');
var myPlugin = require('my-plugin');
var cli = nash();

cli.register(myPlugin, {
  option1: 'this data gets passed to the plugin'
});
```

**Example plugin:**

```js
exports.register = function (cli, options) {
  
  cli.command('something')
    .handler(function () {
      
      // Do something here
    });
};
```

Each plugin must export a `register()` method. This method is called and given the arguments:

1. cli object
2. options you pass when registering the plugin


## Run Tests

```
npm install
npm test
```

## License

[MIT](https://github.com/scottcorgan/nash/blob/master/LICENSE)
