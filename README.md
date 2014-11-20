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

Create a command with the given name(s). Supports a single name, and array of names, or multiple names separated by commas as arguments to the command method. Returns an instance of [`Command`](#command).

#### flag(name[, names, ...])

Create a flag with the given name(s). Supports a single name, and array of names, or multiple names separated by commas as arguments to the command method. Returns an instance of [`Flag`](#flag).

#### beforeAll(callback[, callback, ...])
#### afterAll(callback[, callback, ...])
#### onInvalidCommand(callback)
#### runFlag(name, data[, callback])
#### register()

### Command

### Flag
