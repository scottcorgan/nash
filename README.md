# nash [![NPM Module](http://img.shields.io/npm/v/nash.svg?style=flat-square)](https://npmjs.org/package/nash) [![Downloads a Month](https://img.shields.io/npm/dm/nash.svg?style=flat-square)](https://npmjs.org/package/nash) [ ![Travis Status for scottcorgan/nash](https://img.shields.io/travis/scottcorgan/nash.svg?style=flat-square)](https://travis-ci.org/scottcorgan/nash)

Craft command-line masterpieces

**API**

* [Cli](#cli)
  * [run](#runargv)
  * [command](#commandname-names-)
  * [default](#defaultcallback)
  * [flag](#flagname-names-)
  * [beforeAll](#beforeallcallback-callback-)
  * [afterAll](#afterallcallback-callback-)
  * [set](#setname-value)
  * [get](#getname)
  * [register](#registerplugin-options)
* [Command](#command)
  * [handler](#handlercallback)
  * [task](#taskname-name-)
  * [flag](#flagname-name-)
  * [before](#beforecallback-callback-)
  * [after](#aftercallback-callback-)
  * [name](#namename-name-)
* [Flag](#flag)
  * [handler](#handlercallback-1)
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
  .handler(function (value, done) {
    
    // Do something when this flag is triggered
    done();
  });

cli.command('list')
  .handler(function (data, flags, done) {
    
    // Do something here
    done();
  });

cli.run(process.argv, function (err) {

  // All done!
});
```

## Cli

### run(argv[, callback])

Run the cli app with the given arguments. Normally you'd pass in `process.argv`. The callback can be used to execute more code after everything has completed.

```js
var nash = require('nash');
var cli = nash();

cli.command('some-command')
  .handler(function (data, flags, done) {
  
    console.log('Some Command');
    done();
  });
  
cli.run(process.argv, function () {
  
  // All done
});
```

### command(name[, names, ...])

Create a command with the given name(s). Supports a single name, and array of names, or multiple names separated by commas as arguments to the command method. Returns an instance of [`Command`](#command).

```js
var nash = require('nash');
var cli = nash();

cli.command('some-command')
  .handler(function (data, flags, done) {
  	
    // Do something here
    done();
  });
```

### default(callback)

Declare a default command to run if no command is provided. This is useful for small cli apps that have no commands and do only one task. This inherits the same api as a normal command.

```js
var nash = require('nash');
var cli = nash();

cli.default()
  .handler(function (data, flags, done) {
  
    // Do stuff here
    done();
  });

cli.run([]);
```

### flag(name[, names, ...])

Create a flag with the given name(s). Supports a single name, and array of names, or multiple names separated by commas as arguments to the command method. Returns an instance of [`Flag`](#flag).

```js
var nash = require('nash');
var cli = nash();

cli.flag('-f')
  .handler(function (value, done) {
  
  	// Do something with this flag value
    done();
  });
```

### beforeAll(callback[, callback, ...])

Add a function or functions to be called before any commands or flags are run. The callback is passed to arguments":

* `data` - the values passed in from the the terminal. 
* `flags` - a key/value map of flags and their corresponding values

```js
var nash = require('nash');
var cli = nash();

cli.beforeAll(function (data, flags, done) {

  // data === ['value']
  // flags === {f: 'flag-value'}
  done();
});

cli.command('some-command')
  .handler(function (data, flags, doen) {
  
    done();
  })
  .flag('-f')
    .handler(function (val, done) {
    
      done();
    });

// This is usually sent in via process.argv
cli.run(['', '', 'some-command', 'value', '-f', 'flag-value']); 
```

### afterAll(callback[, callback, ...])

Does the same thing as `beforeAll()`, except runs the callbacks after all the commands and flags are run.

### set(name, value)

Cli-level/app-level settings. Set the given `name` to the given `value

* `name` - name of key. Name, can also be a key/value object of multiple values
* `value` - value of name

```js

var nash = require('nash');
var cli = nash();

cli.set('key', 'value');
cli.set({
  key1: 'value1',
  key2: 'value2'
});

```

### get(name)

Cli-level/app-level getter for settings.

* `name` - name of key to get

### register(plugin(s), callback)

Register a plugin with your command-line application. This provides extensibility and modularity. See [Plugins](#plugins) for more information.

## Command

Running `cli.command('name')` creates an instance of the Command class with following methods available:

### handler(callback)

The callback gets executed when the command is called. Any values passed in to the run method on the cli get passed into the callback. You must call the `done()` callback to pass execution back to the cli.

```js
var nash = require('nash');
var cli = nash();


// Sync mode
cli.command('some-command')
  .handler(function (data, flags, done) {

    // value === 'value'
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
  .handler(function (data, flags, done) {
  	
    // Do something here
    done();
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
  .handler(function (value, done) {
  
    // Do something here
    done();
  });

cli.run(['', '', 'command', '-f']);
```

### before(callback[, callback, ...])

Add a function or functions to be called before the command and the command's flags are run. This has the same callback signature as Cli's [`beforeAll()`](#beforeallcallback-callback-)

### after(callback[, callback, ...])

This is the same as the `before()` method, except this is called after the command and all it's flags run.

### name(name[, name, ...])

Add more names to the command. Helpful if you want aliases or mispellings to trigger the command. This can also be used to get all the aliases for a given command.


```js
var nash = require('nash');
var cli = nash();

cli.command('command')
  .name('cmd', 'commnd')
```

## Flag

Running `cli.flag('name')` or `cli.command('name').flag('name')` creates an instance of the Flag class. If created under a command, the flag only runs with that command. The Flag class has the following methods available:

### handler(callback)

The callback gets executed when the flag is called. Any values passed in to the run method on the cli get passed into the callback. The `done()` callback must be called to pass execution back to the cli.

```js
var nash = require('nash');
var cli = nash();


// Sync mode
cli.command('some-command')
  .flag('-f')
  .handler(function (value, done) {
  
    // Do something here
    done();
  });


// Usually passed process.argv
cli.run(['', '', 'some-command', '-f']);

```

### override()

If no value or a value of `true` is passed in, this command specific flag will override the cli/global flag. If set to `false` or not called, the flag will run in series after the cli/global flag.

```js
var nash = require('nash');
var cli = nash();


cli.flag('-f')
	.handler(function (value, done) {
    
    done():
  });

cli.command('some-command')
  .flag('-f')
  .override()
  .handler(function (value, done) {
  
    // Only this flag runs for -f
    done();
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

Nash lets you register plugins via the [`register`](#registerplugin-options) method on the cli object. This makes it easier to break up your app as it grows.

YOu can register an array of plugins or a single plugin. Each object used to register the plugin must contain a `register` key with the value being the plugin function. See below for examples.

Optionally, you can provide an options object to pass to each plugin.

**Example of registering a plugin:**

```js
var nash = require('nash');
var myPlugin = require('my-plugin');
var cli = nash();

cli.register([{
  register: myPlugin,
  options: {
    key: 'value'
  }
}], function (err) {

  // Done loading plugins
});
```

**Example plugin:**

```js
module.exports = function (cli, options, done) {
  
  cli.command('something')
    .handler(function (data, flags, done) {
      
      // Do something here
      done();
    });
  
  done();
};
```

Each plugin must export a function. This method is called and given the arguments:

1. Cli object.
2. Options you pass when registering the plugin.
3. Callback. This must be called in order to complete the registration process


## Run Tests

```
npm install
npm test
```

## License

[MIT](https://github.com/scottcorgan/nash/blob/master/LICENSE)
