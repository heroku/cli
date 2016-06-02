'use strict';

let co = require('co');
let cli = require('heroku-cli-util');
const updateCoupling = require('../../lib/api').updateCoupling;

module.exports = {
  topic: 'pipelines',
  command: 'update',
  description: 'update this app\'s stage in a pipeline',
  help: 'Example:\n  $ heroku pipelines:update -s staging -a example-admin\n  Changing example-admin to staging... done',
  needsApp: true,
  needsAuth: true,
  flags: [
    {name: 'stage', char: 's', description: 'new stage of app', hasValue: true}
  ],
  run: cli.command(co.wrap(function* (context, heroku) {
    if(!context.flags.stage) {
      cli.error('Stage must be specified with -s');
      process.exit(1);
    }

    const app   = context.app;
    const stage = context.flags.stage;

    yield cli.action(`Changing ${app} to ${stage}`,
                     updateCoupling(heroku, app, stage));
  }))
};
