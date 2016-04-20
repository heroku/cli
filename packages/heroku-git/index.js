exports.topic = {name: 'git', description: 'manage local git repository for app'}

exports.commands = [
  require('./commands/git/remote'),
  require('./commands/git/clone')
]
