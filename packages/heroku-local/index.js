exports.topics = [{
  name: 'local',
  description: 'run heroku app locally'
}];

exports.commands = [
  require('./lib/commands/local'),
  require('./lib/commands/version')
];
