'use strict';

exports.topic = {
  name: 'clients',
  description: 'manage OAuth clients on the platform'
};

exports.commands = [
  require('./commands/authorizations'),
  require('./commands/clients'),
  require('./commands/clients/create'),
  require('./commands/clients/info'),
  require('./commands/clients/update'),
  require('./commands/clients/destroy'),
];
