module.exports = function(topic) {
  return {
    topic: topic,
    command: 'release',
    description: 'creates a slug tarball from the built image and releases it to your Heroku app',
    help: 'help text for ' + topic + ':release',
    run: function() {
      console.log('running release!');
    }
  };
};
