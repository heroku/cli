exports.topics = [{
  name: 'status',
  description: 'Status of Heroku Platform'
}];

exports.commands = [
  require('./lib/commands/status')
];
