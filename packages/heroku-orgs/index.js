exports.topics = [
  {name: 'access', description: 'CLI to manage access in Heroku Applications'},
  {name: 'orgs',   description: 'manage organizations'},
  {name: 'sharing', hidden: true}
];

exports.commands = [
  require('./commands/access'),
  require('./commands/access').sharing,
  require('./commands/access/add'),
  require('./commands/access/add').sharing,
  require('./commands/access/remove'),
  require('./commands/access/remove').sharing,
  require('./commands/access/update'),
  require('./commands/orgs'),
  require('./commands/orgs/open'),
  require('./commands/apps/join'),
  require('./commands/apps/leave'),
  require('./commands/apps/lock'),
  require('./commands/apps/unlock'),
  require('./commands/members'),
  require('./commands/members/add').add,
  require('./commands/members/add').set,
  require('./commands/members/remove'),
  require('./commands/apps/transfer'),
  require('./commands/apps/transfer').sharing
];
