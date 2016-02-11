exports.topics = [
  {name: 'access', description: 'CLI to manage access in Heroku Applications'},
  {name: 'orgs',   description: 'manage organizations'},
];

exports.commands = [
  require('./commands/access'),
  require('./commands/access/add'),
  require('./commands/access/remove'),
  require('./commands/access/update'),
  require('./commands/orgs'),
  require('./commands/orgs/open'),
  require('./commands/apps/join'),
  require('./commands/apps/leave'),
  require('./commands/apps/lock'),
  require('./commands/apps/unlock')
];
