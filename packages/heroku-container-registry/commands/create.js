var fs = require('fs');
var path = require('path');
var child = require('child_process');
var _ = require('lodash');
var exists = require('is-there');
var state = require('../lib/state');
var docker = require('../lib/docker');
var platforms = require('../platforms');

module.exports = function(topic) {
  return {
    topic: topic,
    command: 'create',
    description: 'creates a local development environment',
    help: `help text for ${topic}:create`,
    flags: [
      { name: 'template', description: 'create a Dockerfile based on a language template', hasValue: true }
    ],
    run: function(context) {
      createDockerfile(context.cwd, context.args.template);
      createImage(context.cwd);
    }
  };
};

function createDockerfile(dir, lang) {
  var dockerfile = path.join(dir, 'Dockerfile');
  var platform = lang ? platforms.find(lang) : platforms.detect(dir);
  if (!platform) return;

  var contents = platform.getDockerfile(dir);
  if (contents) {
    fs.writeFileSync(dockerfile, contents);
    console.log(`Wrote Dockerfile for ${platform.name} apps`);
  }
}

function createImage(dir) {
  var dockerfile = path.join(dir, 'Dockerfile');
  if (!exists.sync(dockerfile)) {
    console.error('Error: No Dockerfile found');
    process.exit();
  }
  docker.buildImage(dir, dockerfile)
    .then(function(imageId) {
      state.set(dir, { runImageId: imageId });
    });
}
