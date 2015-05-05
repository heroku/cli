var url = require('url');
var child = require('child_process');
var _ = require('lodash');
var docker = require('../lib/docker');
var safely = require('../lib/safely');

module.exports = function(topic) {
  return {
    topic: topic,
    command: 'clean',
    description: 'clean up docker images',
    help: 'Clean up and remove local Heroku-created Docker images',
    run: safely(clean)
  }
};

function clean(context) {
  var images = docker.getAllImages();
  images.forEach(removeImage);
  return images;
}

function removeImage(image) {
  docker.execSync(`rmi -f ${image}`);
}
