# nash [ ![Codeship Status for scottcorgan/nash](https://codeship.com/projects/63cd73f0-528e-0132-350c-1e034fd16c6e/status)](https://codeship.com/projects/48678)

Command-line masterpieces

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

## Api

### Cli

#### command(name[, names, ...])

Create a command with the given name(s). Supports a single name, and array of names, or multiple names separated by commas as arguments to the command method. Returns an instance of [`Command`]().

#### flag(name[, names, ...])

Create a flag with the given name(s). Supports a single name, and array of names, or multiple names separated by commas as arguments to the command method. Returns an instance of [`Flag`]().

#### beforeAll(callback[, callback, ...])
#### afterAll(callback[, callback, ...])
#### onInvalidCommand(callback)
#### runFlag(name, data[, callback])
#### register(plugin[, options])

### Command

Running `cli.command('name')` creates an instance of the Command class with following methods available:

#### handler(callback)
#### task(name[, name, ...])
#### flag(name[, name, ...])
#### async()
#### before(callback[, callback, ...])
#### after(callback[, callback, ...])
#### name(name[, name, ...])
#### deprecate()
#### deprecatedShouldExit()

### Flag

Running `cli.flag('name')` or `cli.command('name').flag('name')` creates an instance of the Flag class. If created under a command, the flag only runs with that command. The Flag class has the following methods available:

#### handler(callback)
#### exit()
#### async()
#### override()
#### name(name[, name, ...])

## Plugins

Nash lets you register plugins via the [`register`](#register) method on the cli object. This makes it easier to break up your command-line app as it grows.

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

Each plugin must export a `register()1 method. This method is called and given the arguments:

1. cli object
2. options you pass when registering the plugin


## Run Tests

```
npm install
npm test
```