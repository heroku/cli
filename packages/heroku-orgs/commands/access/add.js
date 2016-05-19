'use strict';

let cli    = require('heroku-cli-util');
let _      = require('lodash');
let Utils  = require('../../lib/utils');
let co     = require('co');
let error  = require('../../lib/error');
let extend = require('util')._extend;

function* run(context, heroku) {
  let appName = context.app;
  let privileges = context.flags.privileges || '';
  let appInfo = yield heroku.get(`/apps/${appName}`);
  let output = `Adding ${cli.color.cyan(context.args.email)} access to the app ${cli.color.magenta(appName)}`;
  let request;
  let orgFlags = [];

  if (Utils.isOrgApp(appInfo.owner.email)) {
    let orgName = Utils.getOwner(appInfo.owner.email);
    let orgInfo = yield heroku.request({
      method: 'GET',
      path: `/v1/organization/${orgName}`,
      headers: { Accept: 'application/vnd.heroku+json; version=2' }
    });
    orgFlags = orgInfo.flags;
  }

  if (_.includes(orgFlags, 'org-access-controls')) {
    if (!privileges) error.exit(1, `Missing argument: privileges`);

    privileges = privileges.split(",");

    // Give implicit `view` access
    privileges.push('view');
    privileges = _.uniq(privileges.sort());
    output += ` with ${cli.color.green(privileges)} privileges`;

    request = heroku.request({
      method: 'POST',
      path: `/organizations/apps/${appName}/collaborators`,
      headers: {
        Accept: 'application/vnd.heroku+json; version=3.org-privileges',
      },
      body: {
        user: context.args.email,
        privileges: privileges
      }
    });
  } else {
    request = heroku.post(`/apps/${appName}/collaborators`, {body: { user: context.args.email }});
  }
  yield cli.action(`${output}`, request);
}

let cmd = {
  topic: 'access',
  needsAuth: true,
  needsApp: true,
  command: 'add',
  description: 'Add new users to your app',
  help: 'heroku access:add user@email.com --app APP # Add a collaborator to your app\n\nheroku access:add user@email.com --app APP --privileges deploy,manage,operate # privileges must be comma separated',
  args: [{name: 'email', optional: false}],
  flags: [
    {name: 'privileges', description: 'list of privileges comma separated', hasValue: true, optional: true}
  ],
  run: cli.command(co.wrap(run))
};

module.exports = cmd;
module.exports.sharing = extend({}, cmd);
module.exports.sharing.hidden = true;
module.exports.sharing.topic = 'sharing';
module.exports.sharing.run = function () {
  cli.error(`This command is now ${cli.color.cyan('heroku access:add')}`);  process.exit(1);
};
