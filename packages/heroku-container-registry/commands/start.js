var path = require('path');
var docker = require('../lib/docker');

var TEMPLATE_PATH = path.resolve(__dirname, '../templates/build-Dockerfile');

module.exports = function(topic) {
  return {
    topic: topic,
    command: 'start',
    description: 'builds and starts a Node.js app based on the cedar-14 image',
    help: `help text for ${topic}:start`,
    run: function(context) {
      docker.startB2D();
      var dockerfile = path.join(context.cwd, 'tmp-Dockerfile');    // TODO: this is a hack. Any way around it?
      docker.writeDockerfile(TEMPLATE_PATH, dockerfile);
      var imageId = docker.buildImage(context.cwd, dockerfile);
      startImage(imageId);
    }
  };
};

function startImage(imageId) {
  console.log('starting image...');
  child.execSync(`docker run --rm -it ${imageId}`, {
    stdio: [0, 1, 2]
  });
}
