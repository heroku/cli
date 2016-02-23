'use strict';

let cli           = require('heroku-cli-util');
let Utils         = require('../../lib/utils');
let error         = require('../../lib/error');
let co            = require('co');

function* run (context, heroku) {
  let appName     = context.app;
  let privileges  = context.flags.privileges;
  let appInfo = yield heroku.apps(appName).info();

  if (!Utils.isOrgApp(appInfo.owner.email)) error.exit(1, `Error: cannot update privileges. The app ${cli.color.cyan(appName)} is not owned by an organization`);

  let request = heroku.request({
    method: 'PATCH',
    path: `/organizations/apps/${appName}/collaborators/${context.args.email}`,
    headers: {
      Accept: 'application/vnd.heroku+json; version=3.org-privileges',
    },
    body: {
      privileges: privileges.split(",")
    }
  });
  yield cli.action(`Updating ${context.args.email} in application ${cli.color.cyan(appName)} with ${privileges} privileges`, request);
}

module.exports = {
  topic: 'access',
  needsAuth: true,
  needsApp: true,
  command: 'update',
  description: 'Update existing collaborators in an org app',
  help: 'heroku access:update user@email.com --app APP --privileges deploy,manage,operate,view',
  args:  [{name: 'email', optional: false}],
  flags: [
    {
      name: 'privileges', hasValue: true, required: true, description: 'comma-delimited list of privileges to update (deploy,manage,operate,view)'
    },
  ],
  run: cli.command(co.wrap(run))
};
