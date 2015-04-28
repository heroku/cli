var path = require('path');
var child = require('child_process');
var url = require('url');
var colors = require('colors');
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
  console.log('\nstarting image...');
  console.log('web process will be available at', colors.yellow.underline(getURL()));
  var envArgComponent = envutil.getFormattedEnvArgComponent(cwd);
  child.execSync(`docker run ${envArgComponent} -p 3000:3000 --rm -it ${imageId} || true`, {
    stdio: [0, 1, 2]
  });
}

function getURL() {
  var host = url.parse(process.env.DOCKER_HOST).hostname;
  return `http://${host}:3000/`;
}
