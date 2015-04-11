var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var exists = require('is-there');

const DEFAULT_ENGINE = '2.2.1';
const ENGINE_MATCHER = /^ruby ["'](.*?)["']$/m;

module.exports = {
  name: 'ruby',
  detect: function(dir) {
    if (exists.sync(path.resolve(dir, 'Gemfile'))) return true;
    if (exists.sync(path.resolve(dir, 'Gemfile.lock'))) return true;
  },
  getDockerfile: function(dir) {
    var templatePath = path.resolve(__dirname, 'Dockerfile.t');
    var template = fs.readFileSync(templatePath, { encoding: 'utf8' });
    var compiled = _.template(template);
    var gemfile = path.resolve(dir, 'Gemfile');
    var engine = getEngines(gemfile).ruby || DEFAULT_ENGINE;
    return compiled({
      ruby_engine: engine
    });
  }
};

function getEngines(gemfile) {
  try {
    var contents = fs.readFileSync(gemfile, { format: 'utf8' });
    var match = contents.match(ENGINE_MATCHER)

    if (match) {
        return { ruby: match[1] };
    }
    return {};
  }
  catch (e) {
    return {};
  }
}
