var _ = require('lodash');

const PLATFORMS = [
  require('./node'),
  require('./ruby'),
  require('./scala'),
  require('./minimal')
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
