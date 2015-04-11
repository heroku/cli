var url = require('url');
var child = require('child_process');
var _ = require('lodash');

module.exports = function(topic) {
  return {
    topic: topic,
    command: 'clean',
    description: 'clean up heroku-docker images',
    help: `help text for ${topic}:clean`,
    run: function(context) {
      var stdout = child.execSync(`docker images`, { encoding: 'utf8' });
      var images = _.map(_.filter(stdout.split('\n'), isImage), lineToId);
      images.forEach(removeImage);
    }
  }
};

function isImage(line) {
  return line.indexOf('heroku-docker') === 0;
}

function lineToId(line) {
  return line.split(' ')[0];
}

function removeImage(image) {
  child.execSync(`docker rmi -f ${image}`);
}
