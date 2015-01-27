var test = require('tape');

var name = require('../lib/name');

test('name: adds names', function (t) {
  
  t.deepEqual(name().add('test').all(), ['test'], 'add single name');
  t.deepEqual(name().add(['test']).all(), ['test'], 'add single name form array');
  t.deepEqual(name().add(['test', 't']).all(), ['test', 't'], 'add multiples names from array');
  t.deepEqual(name().add('test', 't').all(), ['test', 't'], 'add multiple names as arguments');
  t.deepEqual(name().add('test', 't').add('test').all(), ['test', 't'], 'add multiple names but ensures unique');
  t.end();
});

test('name: removes names', function (t) {
  
  t.deepEqual(name('test', 't').remove('test').all(), ['t'], 'remove single name');
  t.deepEqual(name('test', 't').remove(['test']).all(), ['t'], 'remove single name with array');
  t.deepEqual(name('test', 't', 'another').remove(['test', 't']).all(), ['another'], 'remove multiple names with array');
  t.deepEqual(name('test', 't', 'another').remove('test', 't').all(), ['another'], 'remove multiple names as arguments');
  t.end();
});

test('name: lists name', function (t) {
  
  var nm = name('test', 't');
  
  t.deepEqual(nm.all(), ['test', 't'], 'name listed');
  t.end();
});

test('name: matching to given name', function (t) {
  
  var nm = name('test', 't', 'another');
  
  t.ok(nm.matches('test'), 'matches single name');
  t.ok(nm.matches(['t']), 'matches single name in array');
  t.ok(nm.matches(['test', 't']), 'matches multiple names in array');
  t.ok(nm.matches('test', 't'), 'matches multiple names as arguments');
  t.end();
});

test('name: toString()', function (t) {
  
  t.equal(name('test', 't').toString(), 'test, t', 'output');
  t.end();
});