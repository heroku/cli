var child = require('child_process');
var fs = require('fs');
var path = require('path');
var state = require('../lib/state');
var docker = require('../lib/docker');

module.exports = function(topic) {
  return {
    topic: topic,
    command: 'exec',
    description: 'Runs a command within the development Docker image',
    help: `help text for ${topic}:exec`,
    variableArgs: true,
    run: function(context) {
      var imageId = docker.ensureExecImage(context.cwd);
      runCommand(imageId, context.cwd, context.args);
    }
  };
};

function runCommand(imageId, cwd, args) {
  var command = args.join(' ');
  var execString = `docker run -p 3000:3000 -v ${cwd}:/app/src -w /app/src --rm -it ${imageId} ${command} || true`;
  child.execSync(execString, {
    stdio: [0, 1, 2]
  });
}
