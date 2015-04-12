var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var exists = require('is-there');

module.exports = {
  name: 'scala',
  detect: function(dir) {
    // this needs to be a bit more wildcardy
    if (exists.sync(path.resolve(dir, '*.sbt'))) return true;
    if (exists.sync(path.resolve(dir, 'project/*.scala'))) return true;
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
