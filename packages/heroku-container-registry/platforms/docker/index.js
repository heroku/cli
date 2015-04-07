var path = require('path');
var exists = require('is-there');

module.exports = {
  name: 'docker',
  detect: function(dir) {
    if (exists.sync(path.resolve(dir, 'Dockerfile'))) return true;
  },
  getDockerfile: function(dir) {

  }
}
