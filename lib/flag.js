var argsList = require('args-list');
var _ = require('lodash');

function Flag (options) {
  this._aliases = options.aliases;
  this._description = '(No description given)';
  this._handler = {
    args: [],
    fn: function () {}
  }
  this._exit = false;
};

Flag.prototype.description = function (desc) {
  this._description = desc;
  return this;
};

Flag.prototype.handler = function (fn) {
  var args = _.initial(argsList(fn));
  
  this._handler = {
    args: args,
    fn: fn
  };
  
  return this;
};

Flag.prototype.secret = function (isSecret) {
  this._secret = isSecret;
  return this;
};

Flag.prototype.execute = function (arg) {
  this._handler.fn.call(this, arg);
  return this;
};

Flag.prototype.exit = function (shouldExit) {
  this._exit = shouldExit;
  return this;
};

module.exports = Flag;