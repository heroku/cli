exports.topics = [{
  name: 'hello',
  description: 'a topic for the hello world plugin'
}];

exports.commands = [
  require('./commands/hello/world')
];
