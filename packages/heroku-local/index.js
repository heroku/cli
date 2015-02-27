exports.topics = [{
  name: 'local',
  description: 'run heroku app locally'
}];

exports.commands = [
  require('./lib/commands/local/start'),
  require('./lib/commands/local/version')
];
