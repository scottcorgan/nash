var flags = require('../lib/flags');
var flag = require('../lib/flag');
var test = require('tape');

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

test('flags: adds dashes', function (t) {
  
  t.equal(flag.addDashes('test'), '--test', '2 dashes to a word');
  t.equal(flag.addDashes('t'), '-t', '1 dash for a letter');
  t.equal(flag.addDashes('--test'), '--test', 'add no dashes for a name with dashes already');
  t.equal(flag.addDashes('-t'), '-t', 'add no dashes for a letter with a dash already');
  t.end();
});