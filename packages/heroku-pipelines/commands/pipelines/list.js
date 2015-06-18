'use strict';

let cli = require('heroku-cli-util');
//let co  = require('co');

module.exports = {
  topic: 'pipelines',
  command: 'list',
  description: 'list pipelines',
  default: true,
  help: 'list pipelines you have access to',
  flags: [
    {name: 'org', char: 'o', description: 'org to list pipelines for', hasValue: true}
  ],
  run: cli.command(function* (context, heroku) {
    cli.log("example github:heroku/example\nsushi   github:heroku/sushi");
  })
};
