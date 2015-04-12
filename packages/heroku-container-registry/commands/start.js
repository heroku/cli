var path = require('path');
var child = require('child_process');
var docker = require('../lib/docker');
var state = require('../lib/state');

var TEMPLATE_PATH = path.resolve(__dirname, '../templates/start-Dockerfile');

module.exports = function(topic) {
  return {
    topic: topic,
    command: 'start',
    description: 'builds a Node.js app based on the cedar-14 image',
    help: `help text for ${topic}:start`,
    run: function(context) {
      var startImageId = docker.ensureStartImage(context.cwd);
      startImage(startImageId);
    }
  };
};

function startImage(imageId) {
  console.log('starting image...');
  child.execSync(`docker run -p 3000:3000 --rm -it ${imageId} || true`, {
    stdio: [0, 1, 2]
  });
}
