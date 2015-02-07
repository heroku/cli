exports.topics = [{
  name: '_status',
  description: 'Status of Heroku Platform'
}];

exports.commands = [
  require('./lib/commands/status')
];
