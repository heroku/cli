exports.topics = [
  { name: 'apps',        description: 'manage apps' },
  { name: 'info',        hidden: true, },
  { name: 'maintenance', description: 'manage maintenance mode for an app' },
  { name: 'stack',       description: 'manage the stack for an app' },
];

exports.commands = [
  require('./commands/info').apps,
  require('./commands/info').root,
  require('./commands/maintenance/on'),
  require('./commands/maintenance/off'),
  require('./commands/maintenance/index'),
  require('./commands/stack'),
  require('./commands/stack/set'),
];
