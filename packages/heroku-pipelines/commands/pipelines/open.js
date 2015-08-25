'use strict';

let cli = require('heroku-cli-util');
let disambiguate = require('../../lib/disambiguate');
var exec = require('child_process').exec;

module.exports = {
  topic: 'pipelines',
  command: 'open',
  description: 'open a pipeline',
  help: 'Open a pipeline in Dashboard.',
  needsApp: false,
  needsAuth: true,
  args: [
    {name: 'pipeline', description: 'name of pipeline', optional: false},
  ],
  run: cli.command(function* (context, heroku) {
    let pipeline = yield disambiguate(heroku, context.args.pipeline);
    let promise = new Promise(function (fulfill) {
      exec(`open https://dashboard.heroku.com/pipelines/${pipeline.id}`, function(error, stdout, stderr) {
        fulfill(stdout);
      });
    });
    let output = yield cli.action("Opening dashboard", promise);
    if (output) console.log(output);
  })
};
