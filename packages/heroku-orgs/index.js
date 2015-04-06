exports.topics = [{
  name: 'access',
  description: 'CLI to manage access in Heroku Applications'
}];

exports.commands = [
  require('./commands/list'),
  require('./commands/add'),
  require('./commands/remove'),
  require('./commands/update')
];
