# nash [ ![Codeship Status for scottcorgan/nash](https://codeship.com/projects/63cd73f0-528e-0132-350c-1e034fd16c6e/status)](https://codeship.com/projects/48678)

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

cli.flag('-p')
  .description('this does something');

cli.command('list')
  .before(function (command, done) {
    // Do something before
    done();
  })
  .handler(function (done) {
    // Do something here
    done();
  });

cli.run(process.argv);
```
