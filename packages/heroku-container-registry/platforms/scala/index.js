var fs = require('fs');
var path = require('path');
var glob = require("glob")
var _ = require('lodash');
var exists = require('is-there');

module.exports = {
  name: 'scala',
  detect: function(dir) {
    if (glob.sync('*.sbt', {cwd: dir}).length != 0) return true;
    if (glob.sync('project/*.sbt', {cwd: dir}).length != 0) return true;
    if (glob.sync('project/*.scala', {cwd: dir}).length != 0) return true;
  },
  getDockerfile: function(dir) {
    var templatePath = path.resolve(__dirname, 'Dockerfile.t');
    var template = fs.readFileSync(templatePath, { encoding: 'utf8' });
    var compiled = _.template(template);
    var jdkUrl = getJdkUrl(dir);
    return compiled({
      jdk_url: jdkUrl
    });
  }
};

function getJdkUrl(dir) {
  return "https://lang-jvm.s3.amazonaws.com/jdk/cedar-14/openjdk1.8-latest.tar.gz";
}
