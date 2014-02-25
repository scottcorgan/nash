var drainer = require('drainer');

module.exports = function (beforeMethods, command, callback) {
  var drain = drainer(beforeMethods);
  drain(command, callback);
};