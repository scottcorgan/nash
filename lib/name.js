var _ = require('lodash');
var flatten = require('flat-arguments');

module.exports = function () {

  var aliases = flatten(arguments);

  var methods = {
    all: function () {

      return aliases;
    },

    add: function () {

      aliases = _.unique(aliases.concat(flatten(arguments)));

      return methods;
    },

    remove: function () {

      aliases = _.xor(aliases, flatten(arguments));

      return methods;
    },

    matches: function () {

      return _.intersection(aliases, flatten(arguments)).length > 0;
    },

    // TODO: test this
    matchesAll: function () {

      var names = flatten(arguments);

      return _.intersection(aliases, names).length >= names.length;
    },

    toString: function () {

      return aliases.join(', ');
    }
  };

  return Object.freeze(methods);
};
