'use strict';

let cli = require('heroku-cli-util');
//let co  = require('co');

module.exports = {
  topic: 'pipelines',
  command: 'show',
  description: 'show pipeline details',
  default: true,
  help: 'show pipeline details',
  args: [
    {name: 'pipeline', description: 'pipeline to show', optional: true}
  ],
  run: cli.command(function* (context, heroku) {
    let pipeline = context.args.pipeline || "example";
    cli.log(`=== ${pipeline}`);
    cli.log("Source type: github");
    cli.log("Source repo: heroku/example");
    cli.log("Staging:     example-staging");
    cli.log("Production:  example");
    cli.log("             example-admin");
    cli.log("Flow:        example-staging —> example, example-admin");
  })
};
