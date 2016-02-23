'use strict';

let cli           = require('heroku-cli-util');
let Utils         = require('../../lib/utils');
let co            = require('co');

function* run(context, heroku) {
  let appName = context.app;
  let appInfo = yield heroku.apps(appName).info();
  let request;

  if (Utils.isOrgApp(appInfo.owner.email)) {
    request = heroku.request({
      method: 'DELETE',
      path: `/organizations/apps/${appName}/collaborators/${context.args.email}`,
      headers: {
        Accept: 'application/vnd.heroku+json; version=3.org-privileges',
      }
    });
  } else {
    request = heroku.apps(appName).collaborators(context.args.email).delete();
  }

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
