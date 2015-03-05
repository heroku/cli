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

function create(env) {
  var outPath = path.join(env.cwd, 'Dockerfile');
  var dockerfileTemplate = fs.readFileSync(TEMPLATE_PATH, { encoding: 'utf8' });
  var compiled = _.template(dockerfileTemplate);

  startB2D();
  buildImage(writeDockerfile());

  function startB2D() {
    console.log('starting boot2docker...');
    child.execSync('boot2docker start');
  }

  function writeDockerfile() {
    console.log('creating Dockerfile...');
    var dockerfile = compiled({ node_engine: '0.10.36' });
    fs.writeFileSync(outPath, dockerfile, { encoding: 'utf8' });
    return outPath;
  }

  function buildImage(dockerfile) {
    console.log('building image...');
    var build = child.execSync(`docker build --force-rm ${env.cwd}`, { encoding: 'utf8' });
    var tokens = build.split(' ');
    var id = tokens[tokens.length - 1];
    console.log(`image id: ${id}`);
  }
}
