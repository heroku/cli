var child = require('child_process');
var fs = require('fs');
var path = require('path');

module.exports = function(topic) {
  return {
    topic: topic,
    command: 'run',
    description: 'runs the built docker image',
    help: `help text for ${topic}:run`,
    variableArgs: true,
    run: function(context) {
      startB2D();
      var imageId = getImageId(context.herokuDir);
      runCommand(context.args);
    }
  };
};

function startB2D() {
  console.log('starting boot2docker...');
  child.execSync('boot2docker start');
}

function getImageId(dir) {
  var statePath = path.join(dir, 'docker.json');
  var state = JSON.parse(fs.readFileSync(statePath, { encoding: 'utf8' }));
  
}

function runCommand(imageId, args) {
  var command = args.join(' ');
  child.execSync(`docker run --rm -it ${imageId} ${command}`);
}
