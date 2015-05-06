exports.topics = [{
  name: 'apps',
  description: 'manage apps'
}];

exports.commands = [
  require('./commands/info'),
  require('./commands/maintenance/on'),
  require('./commands/maintenance/off'),
  require('./commands/maintenance/index')
];
