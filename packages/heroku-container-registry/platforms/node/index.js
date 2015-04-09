var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var exists = require('is-there');

module.exports = {
  name: 'node',
  detect: function(dir) {
    if (exists.sync(path.resolve(dir, 'package.json'))) return true;
    if (exists.sync(path.resolve(dir, 'server.js'))) return true;
  },
  getDockerfile: function(dir) {
    var templatePath = path.resolve(__dirname, 'Dockerfile.t');
    var template = fs.readFileSync(templatePath, { encoding: 'utf8' });
    var compiled = _.template(template);
    var pkg = path.resolve(dir, 'package.json');
    var engine = getEngines(pkg).node || '0.10.38';
    return compiled({
      node_engine: engine
    });
  }
};

function getEngines(pkg) {
  try {
    var contents = fs.readFileSync(pkg, { format: 'utf8' });
    var json = JSON.parse(contents);
    return json.engines || {};
  }
  catch (e) {
    return {};
  }
}
