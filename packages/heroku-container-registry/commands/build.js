module.exports = function(topic) {
  return {
    topic: topic,
    command: 'build',
    description: 'builds a Node.js app based on the cedar-14 image',
    help: 'help text for ' + topic + ':build',
    run: function() {
      console.log('running build!');
    }
  };
};
