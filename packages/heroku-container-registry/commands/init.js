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
    command: 'init',
    description: 'creates a Dockerfile for local development',
    help: `help text for ${topic}:init`,
    flags: [
      { name: 'template', description: 'create a Dockerfile based on a language template', hasValue: true }
    ],
    run: function(context) {
      createDockerfile(context.cwd, context.args.template);
    }
  };
};

function createDockerfile(dir, lang) {
  var dockerfile = path.join(dir, docker.filename);
  var platform = lang ? platforms.find(lang) : platforms.detect(dir);
  if (!platform) return;

  var contents = platform.getDockerfile(dir);
  if (contents) {
    fs.writeFileSync(dockerfile, contents);
    console.log(`Wrote Dockerfile (${platform.name})`);
  }
  else {
    console.log('Nothing to write');
  }
}
