exports.topics = [
  {
    name: 'git'
  }
];

exports.commands = [
  require('./commands/remote'),
  require('./commands/clone')
];
