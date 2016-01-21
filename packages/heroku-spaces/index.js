'use strict';

exports.topic = {
  name: 'spaces',
  description: 'manage heroku private spaces',
};

exports.commands = [
  require('./commands'),
  require('./commands/create'),
  require('./commands/destroy'),
  require('./commands/info'),
  require('./commands/rename'),
  require('./commands/trusted-ips'),
  require('./commands/trusted-ips/add'),
  require('./commands/trusted-ips/remove'),
];
