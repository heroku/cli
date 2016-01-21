'use strict';

exports.topic = {
  name: 'clients',
  description: 'manage OAuth clients on the platform'
};

exports.commands = [
  require('./commands'),
];
