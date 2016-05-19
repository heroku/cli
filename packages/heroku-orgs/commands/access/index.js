'use strict';

let cli       = require('heroku-cli-util');
let extend    = require('util')._extend;
let _         = require('lodash');
let Utils     = require('../../lib/utils');
let co        = require('co');
let orgFlags;

function orgHasGranularPermissions(orgFlags) {
  return _.includes(orgFlags, 'org-access-controls') || _.includes(orgFlags, 'static-permissions');
}
function printJSON (collaborators) {
  cli.log(JSON.stringify(collaborators, null, 2));
}

function printAccess (app, collaborators) {
  let showPrivileges = Utils.isOrgApp(app.owner.email) && (orgHasGranularPermissions(orgFlags));
  collaborators = _.chain(collaborators)
  .sortBy(c => c.email || c.user.email)
  .reject(c => /herokumanager\.com$/.test(c.user.email))
  .map(collab => {
    let email = collab.user.email;
    let role = collab.role;
    let data = { email: email, role: role || 'collaborator' };

    if (showPrivileges) {
      data.privileges = _.map(_.sortBy(collab.privileges, 'name'), 'name');
    }
    return data;
  }).value();

  let columns = [
    {key: 'email', label: 'Email', format: e => cli.color.cyan(e)},
    {key: 'role', label: 'Role', format: r => cli.color.green(r)}
  ];
  if (showPrivileges) columns.push({key: 'privileges', label: 'Privileges'});
  cli.table(collaborators, {printHeader: false, columns});
}

function* run (context, heroku) {
  let appName = context.app;

  let app = yield heroku.get(`/apps/${appName}`);
  let isOrgApp = Utils.isOrgApp(app.owner.email);

  let collaborators = yield heroku.request({
    method: 'GET',
    path: isOrgApp ? `/organizations/apps/${appName}/collaborators` : `/apps/${appName}/collaborators`,
    headers: { Accept: 'application/vnd.heroku+json; version=3.org-privileges' }
  });

  if (isOrgApp) {
    let orgName = Utils.getOwner(app.owner.email);
    let orgInfo = yield heroku.request({
      method: 'GET',
      path: `/v1/organization/${orgName}`,
      headers: { Accept: 'application/vnd.heroku+json; version=2' }
    });

    orgFlags = orgInfo.flags;
    if (orgHasGranularPermissions(orgFlags)) {
      try {
        let admins = yield heroku.get(`/organizations/${orgName}/members`);
        admins = _.filter(admins, { 'role': 'admin' });

        let adminPrivileges = yield heroku.request({
          method: 'GET',
          path: '/organizations/privileges',
          headers: { Accept: 'application/vnd.heroku+json; version=3.org-privileges' }
        });

        admins = _.forEach(admins, function(admin) {
          admin.user = { email: admin.email };
          admin.privileges = adminPrivileges;
          return admin;
        });

        collaborators = _.reject(collaborators, { role: 'admin'}); // Admins might have already privileges
        collaborators = _.union(collaborators, admins);
      } catch (err) {
        if (err.statusCode !== 403) throw err;
      }
    }
  }

  if (context.flags.json) printJSON(collaborators);
  else                    printAccess(app, collaborators);
}

let cmd = {
  topic:        'access',
  description:  'list who has access to an application',
  needsAuth:    true,
  needsApp:     true,
  flags: [
    {name: 'json', description: 'output in json format'},
  ],
  run:          cli.command(co.wrap(run))
};

module.exports = cmd;
module.exports.sharing = extend({}, cmd);
module.exports.sharing.hidden = true;
module.exports.sharing.topic = 'sharing';
module.exports.sharing.run = function () {
  cli.error(`This command is now ${cli.color.cyan('heroku access')}`);
  process.exit(1);
};
