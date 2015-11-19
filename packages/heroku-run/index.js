'use strict';

exports.topics = [{
  name: 'run',
  description: 'run a one-off process inside a Heroku dyno',
}, {
  name: 'logs',
  description: 'display recent log output',
}];

exports.commands = [
  require('./commands/run'),
  require('./commands/detached'),
  require('./commands/logs'),
];
