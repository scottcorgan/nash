var _ = require('lodash');
var flatten = require('flat-arguments');
var exclude = require('exclude');

var exports = module.exports = function () {
  
  return new Name(flatten(arguments));
};

var Name = exports.Instance = function () {
  
  this.aliases = flatten(arguments);
};

Name.prototype.all = function () {
  
  return this.aliases;
};

Name.prototype.add = function () {
  
  this.aliases = _.unique(this.aliases.concat(flatten(arguments)));
  
  return this;
};

Name.prototype.remove = function () {
 
 
  this.aliases = exclude(this.aliases, flatten(arguments));
  
  return this;
};

Name.prototype.matches = function () {
  
  return _.intersection(this.aliases, flatten(arguments)).length > 0;
};

Name.prototype.toString = function () {
  
  return this.aliases.join(', ');
};