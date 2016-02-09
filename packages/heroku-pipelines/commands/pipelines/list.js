'use strict';

let cli = require('heroku-cli-util');

module.exports = {
  topic: 'pipelines',
  command: 'list',
  description: 'list pipelines',
  help: 'List pipelines you have access to.\n\n  Example:\n  $ heroku pipelines:list\n  example\n  sushi',
  default: true,
  needsAuth: true,
  run: cli.command(function* (context, heroku) {
    let pipelines = yield heroku.request({
      method: 'GET',
      path: "/pipelines",
      headers: { 'Accept': 'application/vnd.heroku+json; version=3' }
    }); // heroku.pipelines().list();
    for (var pipeline in pipelines) {
      if (pipelines.hasOwnProperty(pipeline)) {
        cli.log(`${pipelines[pipeline].name}`);
      }
    }
  })
};
