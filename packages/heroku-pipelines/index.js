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
    flags: [
      {name: 'user', char: 'u', description: 'user to say hello to', hasValue: true}
    ],
    run: function (context) {
      if (context.args.user) {
        console.log(`Hello, ${context.args.user}!`);
      } else {
        console.log('Hello, World!');
      }
    }
  }
];
