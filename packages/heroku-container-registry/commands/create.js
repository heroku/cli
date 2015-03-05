module.exports = function(topic) {
  return {
    topic: topic,
    command: 'create',
    description: 'creates a cedar-14 based Dockerfile',
    help: 'help text for ' + topic + ':create',
    run: function() {
      console.log('running create!');
    }
  };
};
