var flatten = require('flat-arguments');
var unique = require('lodash.uniq');
var intersection = require('lodash.intersection');
var xor = require('lodash.xor');

module.exports = function () {

  var aliases = flatten(arguments);

  var methods = {
    all: function () {

      return aliases;
    },

    add: function () {

      aliases = unique(aliases.concat(flatten(arguments)));

      return methods;
    },

    remove: function () {

      aliases = xor(aliases, flatten(arguments));

      return methods;
    },

    matches: function () {

      return intersection(aliases, flatten(arguments)).length > 0;
    },

    // TODO: test this
    matchesAll: function () {

      var names = flatten(arguments);

      return intersection(aliases, names).length >= names.length;
    },

    toString: function () {

      return aliases.join(', ');
    }
  };

  return Object.freeze(methods);
};
