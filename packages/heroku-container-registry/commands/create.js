var fs = require('fs');
var path = require('path');
var child = require('child_process');
var _ = require('lodash');
var state = require('../lib/state');

const TEMPLATE_PATH = path.resolve(__dirname, '../templates/Dockerfile');

module.exports = function(topic) {
  return {
    topic: topic,
    command: 'create',
    description: 'creates a cedar-14 based Dockerfile',
    help: `help text for ${topic}:create`,
    run: function(context) {
      startB2D();
      var dockerfile = writeDockerfile(context.cwd);
      var imageId = buildImage(context.cwd, dockerfile);
      state.set(context.cwd, { imageId: imageId });
    }
  };
};

function startB2D() {
  console.log('starting boot2docker...');
  child.execSync('boot2docker start');
  child.execSync('$(boot2docker shellinit)');
}

function writeDockerfile(cwd) {
  console.log('creating Dockerfile...');
  var outPath = path.join(cwd, 'Dockerfile');
  var dockerfileTemplate = fs.readFileSync(TEMPLATE_PATH, { encoding: 'utf8' });
  var compiled = _.template(dockerfileTemplate);
  var dockerfile = compiled({ node_engine: '0.10.36' });
  fs.writeFileSync(outPath, dockerfile, { encoding: 'utf8' });
  return outPath;
}

function buildImage(cwd, dockerfile) {
  console.log('building image...');
  var build = child.execSync(`docker build --force-rm ${cwd}`, { encoding: 'utf8' });
  var tokens = build.trim().split(' ');
  var id = tokens[tokens.length - 1];
  return id;
}
