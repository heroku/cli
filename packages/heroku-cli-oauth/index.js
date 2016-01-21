'use strict';

exports.topic = {
  name: 'clients',
  description: 'manage OAuth clients on the platform'
};

exports.commands = [
  require('./commands'),
  require('./commands/create'),
  require('./commands/info'),
  require('./commands/update'),
];
