var url = require('url');
var child = require('child_process');
var _ = require('lodash');

module.exports = function(topic) {
  return {
    topic: topic,
    command: 'clean',
    description: 'clean up docker images',
    help: 'Clean up and remove local Heroku-created Docker images',
    run: function(context) {
      var stdout = child.execSync(`docker images`, { encoding: 'utf8' });
      var images = _.map(_.filter(stdout.split('\n'), isImage), lineToId);
      images.forEach(removeImage);
      return images;
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
