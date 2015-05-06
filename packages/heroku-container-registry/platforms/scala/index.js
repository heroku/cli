var fs = require('fs');
var path = require('path');
var glob = require("glob")
var _ = require('lodash');
var exists = require('is-there');

module.exports = {
  name: 'scala',
  detect: function(dir) {
    if (glob.sync('*.sbt', {cwd: dir}).length === 0) return true;
    if (glob.sync('project/*.sbt', {cwd: dir}).length === 0) return true;
    if (glob.sync('project/*.scala', {cwd: dir}).length === 0) return true;
  },
  getDockerfile: function(dir) {
    var templatePath = path.resolve(__dirname, 'Dockerfile.t');
    var template = fs.readFileSync(templatePath, { encoding: 'utf8' });
    var compiled = _.template(template);
    var appName = getAppName(dir);
    return compiled({
      app_name: appName
    });
  }
};

function getAppName(dir) {
  var f = null
  fs.readdirSync(path.join(dir, 'target/universal/stage/bin/')).forEach(function(file) {
    if (path.extname(file) == '') {
      f = file;
    }
  });
  return f;
}
