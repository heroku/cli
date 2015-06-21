exports.topics = [{
  name: 'apps',
  description: 'manage apps'
}];

exports.commands = [
  require('./commands/info').apps,
  require('./commands/info').root,
  require('./commands/maintenance/on'),
  require('./commands/maintenance/off'),
  require('./commands/maintenance/index'),
  require('./commands/stack'),
  require('./commands/stack/set'),
];
