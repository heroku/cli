var fs = require('fs');
var path = require('path');
var _ = require('lodash');

module.exports = {
  name: 'minimal',
  detect: function(dir) {
    return true;
  },
  getDockerfile: function(dir) {
    var templatePath = path.resolve(__dirname, 'Dockerfile.t');
    var template = fs.readFileSync(templatePath, { encoding: 'utf8' });
    var compiled = _.template(template);
    return compiled({});
  }
};
