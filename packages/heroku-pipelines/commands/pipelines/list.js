'use strict';

let cli = require('heroku-cli-util');

module.exports = {
  topic: 'pipelines',
  command: 'list',
  description: 'list pipelines you have access to',
  help: 'Example:\n  $ heroku pipelines:list\n  === My Pipelines\n  example\n  sushi',
  default: true,
  needsAuth: true,
  run: cli.command(function* (context, heroku) {
    let pipelines = yield heroku.request({
      method: 'GET',
      path: "/pipelines",
      headers: { 'Accept': 'application/vnd.heroku+json; version=3' }
    }); // heroku.pipelines().list();

    cli.styledHeader(`My Pipelines`);
    for (var pipeline in pipelines) {
      if (pipelines.hasOwnProperty(pipeline)) {
        cli.log(`${pipelines[pipeline].name}`);
      }
    }
  })
};
