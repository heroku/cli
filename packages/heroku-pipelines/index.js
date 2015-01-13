exports.topics = [{
  name: 'hello',
  description: 'a topic for the hello world plugin'
}];

exports.commands = [
  {
    topic: 'hello',
    command: 'world',
    description: 'tells you hello',
    help: 'help text for hello:world',
    run: function () {
      console.log('Hello, World!');
    }
  }
];
