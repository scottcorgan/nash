var test = require('tape');

var wrappers = require('../lib/wrappers');

test('wrappers: instance', function (t) {
  
  t.ok(wrappers() instanceof wrappers.Instance, 'instance of wrappers');
  t.ok(wrappers().internals.options, 'initiates options');
  t.end();
});

test('wrappers: raw array of wrappers', function (t) {
  
  var wrap = wrappers();
  
  t.ok(wrap.internals.all, 'all internal');
  t.ok(wrap.all, 'all getter');
  t.end();
});

test('wrappers: adds single wrappers', function (t) {
  
  t.deepEqual(wrappers().add(wrapFn).all(), [[wrapFn]], 'wrapper fn as argument');
  t.deepEqual(wrappers().add([wrapFn]).all(), [[wrapFn]], 'wrapper fn from array');
  t.end();
  
  function wrapFn () {
    wrapFn();
  }
});

test('wrappers: adds multiple wrappers at a time', function (t) {
  
  var wrap1 = wrappers();
  var wrap2 = wrappers();
  
  wrap1.add(fn1);
  wrap1.add([fn1, fn2]);
  wrap2.add(fn1, fn2);
  
  t.deepEqual(wrap1.all(), [[fn1], [fn1, fn2]], 'adds multiple functions from array');
  t.deepEqual(wrap2.all(), [[fn1, fn2]], 'adds multiple functions as arguments');
  t.end();
  
  function fn1 () {}
  function fn2() {}
});

test('wrappers: runs all the wrapper functions', function (t) {
  
  var wrap = wrappers();
  var wrapFn1Called = false;
  var wrapFn2Called = false;
  var wrapFn3Called = false;
  
  wrap.add(function (done) {
    
    wrapFn1Called = true;
    done();
  });
  
  wrap.add(function (done) {
    
    wrapFn2Called = true;
    done();
  }, function (done) {
    
    wrapFn3Called = true;
    done();
  });
  
  wrap.run(function () {
    
    t.ok(wrapFn1Called, 'called first fn');
    t.ok(wrapFn2Called, 'called second fn');
    t.ok(wrapFn3Called, 'called third fn');
    t.end();
  });
});

test('wrappers: runs wrapper functions with given values passed into functions', function (t) {
  
  t.plan(4);  
  
  var wrap = wrappers();

  wrap.add(function (val1, val2, done) {
    
    t.equal(val1, 'val1', 'passed in value 1');
    t.equal(val2, 'val2', 'passed in value 2');
    t.ok(typeof done, 'function', 'passed in callback');
    
    done();
  });
  
  wrap.run('val1', 'val2', function () {
    
    t.ok(true, 'done');
  });
});

test('wrappers: runs commands added seperately in series', function (t) {
  
  t.plan(1);
  
  var callstack = [];
  var wrap = wrappers();
  
  wrap
    .add(function (done) {
      
      callstack.push('wrap1');
      done();
    })
    .add(function (done) {
      
      callstack.push('wrap2');
      done();
    });
  
  wrap.run(function () {
    
    t.deepEqual(callstack, ['wrap1', 'wrap2']);
  });
});

test('wrappers: runs commands added together in parallel', function (t) {
  
  var callstack = [];
  var wrap = wrappers();
  
  wrap
    .add(function (done) {
      
      callstack.push('wrap1');
      done();
    })
    .add(
      function (done) {
        
        process.nextTick(function () {
          
          callstack.push('wrap2');
          done();
        });
      },
      function (done) {
        
        callstack.push('wrap3');
        done();
      }
    )
    .add(function (done) {
      
      callstack.push('wrap4');
      done();
    });
  
  wrap.run(function () {
    
    var expectedCallstack = ['wrap1', 'wrap3', 'wrap2', 'wrap4'];
    
    t.deepEqual(callstack, expectedCallstack, 'called in series or parallel');
    t.end();
  });
});