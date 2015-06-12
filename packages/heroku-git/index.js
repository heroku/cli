exports.topics = [
  {
    name: 'git'
  }
];

exports.commands = [
  require('./commands/git/remote'),
  require('./commands/git/clone')
];
