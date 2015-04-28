var path = require('path');
var child = require('child_process');
var docker = require('../lib/docker');
var state = require('../lib/state');
var envutil = require('../lib/env-util');

var TEMPLATE_PATH = path.resolve(__dirname, '../templates/start-Dockerfile');

module.exports = function(topic) {
  return {
    topic: topic,
    command: 'start',
    description: 'start docker app container',
    help: 'Start local Docker app container',
    run: function(context) {
      var startImageId = docker.ensureStartImage(context.cwd);
      startImage(startImageId, context.cwd);
    }
  };
};

function startImage(imageId, cwd) {
  if (!imageId) return;
  console.log('starting image...');
  var envArgComponent = envutil.getFormattedEnvArgComponent(cwd);
  child.execSync(`docker run ${envArgComponent} -p 3000:3000 --rm -it ${imageId} || true`, {
    stdio: [0, 1, 2]
  });
}
