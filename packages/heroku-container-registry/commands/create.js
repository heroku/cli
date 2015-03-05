var fs = require('fs');
var path = require('path');
var _ = require('lodash');

const TEMPLATE_PATH = path.resolve(__dirname, '../templates/Dockerfile');

module.exports = function(topic) {
  return {
    topic: topic,
    command: 'create',
    description: 'creates a cedar-14 based Dockerfile',
    help: 'help text for ' + topic + ':create',
    run: create
  };
};

function create(env) {
  var outPath = path.join(env.cwd, 'Dockerfile');
  var dockerfileTemplate = fs.readFileSync(TEMPLATE_PATH, { encoding: 'utf8' });
  var compiled = _.template(dockerfileTemplate);

  createDockerfile()
    .then(buildImage);

  function createDockerfile() {
    console.log('creating Dockerfile...');

    var dockerfile = compiled({ engines_node: '0.10.36' });
    fs.writeFileSync(outPath, dockerfile, { encoding: 'utf8' });
    return Promise.resolve();
  }

  function buildImage() {
    console.log('building image...');
  }
}
