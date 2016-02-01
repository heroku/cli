'use strict';

let cli = require('heroku-cli-util');

const removeCoupling = require('../../lib/api').removeCoupling;

module.exports = {
  topic: 'pipelines',
  command: 'remove',
  description: 'remove this app from its pipeline',
  help: 'Remove this app from its pipeline.\n\n  Example:\n  $ heroku pipelines:remove -a example-admin\n  Removing example-admin... done',
  needsApp: true,
  needsAuth: true,
  run: cli.command(function* (context, heroku) {
    const app = context.app;

    yield cli.action(`Removing ${app}`, removeCoupling(heroku, app));
  })
};
