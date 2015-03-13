var fs = require('fs');
var path = require('path');
var child = require('child_process');
var _ = require('lodash');
var state = require('../lib/state');
var docker = require('../lib/docker');

const TEMPLATE_PATH = path.resolve(__dirname, '../templates/run-Dockerfile');

module.exports = function(topic) {
  return {
    topic: topic,
    command: 'create',
    description: 'creates a cedar-14 based Dockerfile',
    help: `help text for ${topic}:create`,
    run: function(context) {
      docker.startB2D();
      // TODO: parse package.json, look for engines.node, use that or default to 0.10.36
      var imageId = docker.buildImageFromTemplate(context.cwd, TEMPLATE_PATH, {
        node_engine: '0.10.36'
      });
      state.set(context.cwd, { runImageId: imageId });
    }
  };
};
