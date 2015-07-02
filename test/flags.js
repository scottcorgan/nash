var test = require('tape');

var flags = require('../lib/flags');
var flag = require('../lib/flag');

test('flags: instance', function (t) {

  t.ok(flags() instanceof flags.Instance, 'instance of Flags');
  t.end();
});

test('flags: instantiates with a list of flags', function (t) {

  var flg = flag('-t');
  var flg2 = flag('-t2');

  t.deepEqual(flags(flg).all(), [flg], 'with single flag');
  t.deepEqual(flags([flg]).all(), [flg], 'with single flag in array');
  t.deepEqual(flags([flg, flg2]).all(), [flg, flg2], 'with multiple flags in array');
  t.deepEqual(flags(flg, flg2).all(), [flg, flg2], 'with multiple flags as arguments');
  t.end();
});

test('flags: raw array of flags', function (t) {

  var flg = flag('-t');
  var flgs = flags(flg);

  t.deepEqual(flgs.all(), [flg], 'list of flags');
  t.end();
});

test('flags: add flag to collection', function (t) {

  var flg = flag('-t');
  var flg2 = flag('-t2');

  t.deepEqual(flags().add(flg).all(), [flg], 'added single flag');
  t.deepEqual(flags().add([flg]).all(), [flg], 'added single flag in array');
  t.deepEqual(flags().add([flg, flg2]).all(), [flg, flg2], 'added multiple flags in array');
  t.deepEqual(flags().add(flg, flg2).all(), [flg, flg2], 'added multiple flags as arguments');
  t.end();
});

test('flags: does not overwrite flag when adding to collection', function (t) {

  var flgs = flags();
  var handler = function () {/* handler */};

  var flg = flag('--test')
    .handler(handler);

  var flg2 = flag('--test', '-t');

  flgs.add(flg);
  flgs.add(flg2);

  t.equal(flgs.all().length, 1, 'one uqique');
  t.equal(flgs.findByName('test').handler().toString(), handler.bind(flg).toString(), 'same flg handler');
  t.ok(flgs.findByName('-t'), 'adds missing names when flags match');
  t.end();
});

test('flags: find flag by name', function (t) {

  var flg1 = flag('-t1', '--test1', '--another1');
  var flg2 = flag('--test2', '-t2');
  var flgs = flags(flg1, flg2);

  t.deepEqual(flgs.findByName('--test1'), flg1, 'by single name');
  t.deepEqual(flgs.findByName(['--test1']), flg1, 'by single name in array');
  t.deepEqual(flgs.findByName(['--test1', '-t1']), flg1, 'by multiple names in array');
  t.deepEqual(flgs.findByName('--test1', '-t1'), flg1, 'by multiple names as arguments');

  t.deepEqual(flgs.findByName('test1'), flg1, 'by single name with no dashes');
  t.deepEqual(flgs.findByName(['test1', '-t1']), flg1, 'by multiple names with no dashes');

  t.end();
});

test('flags: runs flags', function (t) {

  t.plan(5);

  var flg1Ran = false;
  var flg2Ran = false;

  var flg1 = flag('-t')
    .handler(function (value, done) {

      t.equal(value, 't value', 'passed in value');

      flg1Ran = true;
      done();
    });

  var flg2 = flag('--test2')
    .handler(function (value, done) {

      t.equal(value, 'test2 value', 'passed in value');
      t.ok(typeof done === 'function', 'passed in callback');

      flg2Ran = true;
      done();
    });

  var flgs = flags(flg1, flg2);

  flgs.run({
    t: 't value',
    test2: 'test2 value'
  }, function (err) {

    t.ok(flg1Ran, 'ran flag 1');
    t.ok(flg2Ran, 'ran flag 2');
  });
});
