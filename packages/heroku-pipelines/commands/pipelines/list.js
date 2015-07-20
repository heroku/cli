'use strict';

let cli = require('heroku-cli-util');
//let co  = require('co');

module.exports = {
  topic: 'pipelines',
  command: 'list',
  description: 'list pipelines',
  default: true,
  help: 'list pipelines you have access to',
  needsAuth: true,
  run: cli.command(function* (context, heroku) {
    let pipelines = yield heroku.request({
      method: 'GET',
      path: "/pipelines",
      headers: { 'Accept': 'application/vnd.heroku+json; version=3.pipelines' }
    }); // heroku.pipelines().list();
    cli.hush(pipelines);
    for (var pipeline in pipelines) {
      cli.log(`${pipelines[pipeline].name}`);
    }
  })
};
