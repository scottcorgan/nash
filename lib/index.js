var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');
var proto = require('./proto');
var mixin = _.extend;

var exports = module.exports = function createCli (options) {
  
  var cli = {
    options: options
  };
  
  mixin(cli, proto);
  mixin(cli, EventEmitter.prototype);
  
  return cli;
};