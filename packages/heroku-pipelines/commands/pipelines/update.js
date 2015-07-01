'use strict';

let cli = require('heroku-cli-util');

module.exports = {
  topic: 'pipelines',
  command: 'update',
  description: 'update an app in a pipeline',
  help: 'Update an app in a pipeline.',
  needsApp: true,
  needsAuth: true,
  flags: [
    {name: 'stage', char: 's', description: 'new stage of app', hasValue: true, optional: false}
  ],
  run: cli.command(function* (context, heroku) {
    if(!context.flags.stage) {
      cli.error('Stage must be specified with -s');
      process.exit(1);
    }
    let promise = heroku.request({
      method: 'PATCH',
      path: `/apps/${context.app}/pipeline-couplings`,
      body: {stage: context.flags.stage},
      headers: { 'Accept': 'application/vnd.heroku+json; version=3.pipelines' }
    }); // heroku.apps(app).pipeline-couplings().update(body);
    let pipeline = yield cli.action(`Changing ${context.app} to ${context.flags.stage}`, promise);
    cli.hush(pipeline);
  })
};
