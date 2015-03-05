module.exports = function(topic) {
  return {
    topic: topic,
    command: 'run',
    description: 'runs the built docker image',
    help: 'help text for ' + topic + ':run',
    run: function() {
      console.log('running run!');
    }
  };
};
