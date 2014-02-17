# nash

Command-line masterpieces

## Install

```
npm install nash --save
```

## Usage

```js
var Nash = require('nash');
var cli = Nash.createCli({
  title: 'My CLI',
  description: 'My CLI description, cool!'
});

cli.flag('-p').description('this does something');

cli.command('list')
  .handler(function (done) {
    // Do something here
    done();
  });

cli.run(process.argv);
```
