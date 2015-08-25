'use strict';

let cli = require('heroku-cli-util');
let co  = require('co');
let disambiguate = require('../../lib/disambiguate');

module.exports = {
  topic: 'pipelines',
  command: 'status',
  description: 'status of a app in a pipeline',
  help: 'Status of an app in a pipeline.',
  needsApp: true,
  needsAuth: true,
  run: cli.command(function* (context, heroku) {
    var name;

    name = context.app;
    cli.log(`Comparing ${context.app} to master... done`)
    cli.log(`${name} behind by 1 commit:`);
    cli.log("  73ab415  2012-01-01  A super important fix  (Joe Developer)");
  })
};
