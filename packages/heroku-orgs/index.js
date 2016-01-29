exports.topics = [
  {name: 'access', description: 'CLI to manage access in Heroku Applications'},
];

exports.commands = [
  require('./commands/access'),
  require('./commands/access/add'),
  require('./commands/access/remove'),
  require('./commands/access/update'),
];
