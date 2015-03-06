var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var child = require('child_process');

const TEMPLATE_PATH = path.resolve(__dirname, '../templates/Dockerfile');

module.exports = function(topic) {
  return {
    topic: topic,
    command: 'create',
    description: 'creates a cedar-14 based Dockerfile',
    help: `help text for ${topic}:create`,
    run: create
  };
};

function create(context) {
  startB2D();
  saveId(buildImage(writeDockerfile()));

  function startB2D() {
    console.log('starting boot2docker...');
    child.execSync('boot2docker start');
  }

  function writeDockerfile() {
    console.log('creating Dockerfile...');
    var outPath = path.join(context.cwd, 'Dockerfile');
    var dockerfileTemplate = fs.readFileSync(TEMPLATE_PATH, { encoding: 'utf8' });
    var compiled = _.template(dockerfileTemplate);
    var dockerfile = compiled({ node_engine: '0.10.36' });
    fs.writeFileSync(outPath, dockerfile, { encoding: 'utf8' });
    return outPath;
  }

  function buildImage(dockerfile) {
    console.log('building image...');
    var build = child.execSync(`docker build --force-rm ${context.cwd}`, { encoding: 'utf8' });
    var tokens = build.trim().split(' ');
    var id = tokens[tokens.length - 1];
    return id;
  }

  function saveId(id) {
    console.log('saving state...');
    var statePath = path.join(context.herokuDir, 'docker.json');
    var state = JSON.stringify({ id: id });
    console.log('state:', state);
    console.log('saving state to:', statePath);
    fs.writeFileSync(statePath, state, { encoding: 'utf8' });
  }
}
