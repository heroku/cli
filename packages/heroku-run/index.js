'use strict';

exports.topics = [{
  name: 'run',
  description: 'run a one-off process inside a Heroku dyno'
}];

exports.commands = [
  require('./commands/run')
];
