'use strict';
let run = require('./lib/run');

exports.topics = [{
  name: '_run',
  description: 'run a one-off process inside a Heroku dyno'
}];

exports.commands = [
  {
    topic: '_run',
    help: `run a one-off process inside a Heroku dyno`,
    variableArgs: true,
    needsAuth: true,
    needsApp: true,
    flags: [
      {name: 'exit-code', description: 'raise same exit code from dyno process'},
    ],
    run: run
  }
];
