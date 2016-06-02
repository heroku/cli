'use strict';

let co = require('co');
let cli = require('heroku-cli-util');

module.exports = {
  topic: 'pipelines',
  command: 'list',
  description: 'list pipelines you have access to',
  help: 'Example:\n  $ heroku pipelines:list\n  === My Pipelines\n  example\n  sushi',
  default: true,
  flags: [
    {name: 'json', description: 'output in json format'},
  ],
  needsAuth: true,
  run: cli.command(co.wrap(function* (context, heroku) {
    let pipelines = yield heroku.get('/pipelines');

    if (context.flags.json) {
      cli.styledJSON(pipelines);
    } else {
      cli.styledHeader(`My Pipelines`);
      for (let pipeline of pipelines) cli.log(pipeline.name);
    }
  }))
};
