var _ = require('lodash');

const PLATFORMS = [
  require('./docker'),
  require('./node'),
  require('./ruby')
];

module.exports = {
  all: PLATFORMS,
  find: function(name) {
    return _.find(PLATFORMS, { name: name });
  },
  detect: function(dir) {
    return _.reduce(PLATFORMS, function(match, platform) {
      if (match) return match;
      return platform.detect(dir) ? platform : undefined;
    }, undefined);
  }
}
