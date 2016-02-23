'use strict';

let cli           = require('heroku-cli-util');
let co            = require('co');

function* run(context, heroku) {
  let appName = context.app;
  let request = heroku.apps(appName).collaborators(context.args.email).delete();
  yield cli.action(`Removing ${cli.color.cyan(context.args.email)} access from the app ${cli.color.magenta(appName)}`, request);
}

module.exports = {
  topic: 'access',
  needsAuth: true,
  needsApp: true,
  command: 'remove',
  description: 'Remove users from your app',
  help: 'heroku access:remove user@email.com --app APP',
  args: [{name: 'email', optional: false}],
  run: cli.command(co.wrap(run))
};
