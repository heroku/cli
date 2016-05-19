'use strict';

let cli   = require('heroku-cli-util');
let _     = require('lodash');
let Utils = require('../../lib/utils');
let error = require('../../lib/error');
let co    = require('co');

function* run (context, heroku) {
  let appName     = context.app;
  let privileges  = context.flags.privileges.split(",");
  let appInfo = yield heroku.get(`/apps/${appName}`);

  if (!Utils.isOrgApp(appInfo.owner.email)) error.exit(1, `Error: cannot update privileges. The app ${cli.color.cyan(appName)} is not owned by an organization`);

  // Give implicit `view` access
  privileges.push('view');
  privileges = _.uniq(privileges.sort());

  let request = heroku.request({
    method: 'PATCH',
    path: `/organizations/apps/${appName}/collaborators/${context.args.email}`,
    headers: {
      Accept: 'application/vnd.heroku+json; version=3.org-privileges',
    },
    body: {
      privileges: privileges
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
  help: 'heroku access:update user@email.com --app APP --privileges deploy,manage,operate',
  args:  [{name: 'email', optional: false}],
  flags: [
    {
      name: 'privileges', hasValue: true, required: true, description: 'comma-delimited list of privileges to update (deploy,manage,operate)'
    },
  ],
  run: cli.command(co.wrap(run))
};
