'use strict'

let cli = require('heroku-cli-util')
let _ = require('lodash')
let Utils = require('../../lib/utils')
let error = require('../../lib/error')
let co = require('co')

function * run (context, heroku) {
  let appName = context.app
  let permissions = context.flags.permissions || context.flags.privileges
  if (!permissions) error.exit(1, 'Required flag:  --permissions PERMISSIONS')

  permissions = permissions.split(',')

  let appInfo = yield heroku.get(`/apps/${appName}`)

  if (context.flags.privileges) cli.warn('DEPRECATION WARNING: use `--permissions` not `--privileges`')
  if (!Utils.isOrgApp(appInfo.owner.email)) error.exit(1, `Error: cannot update permissions. The app ${cli.color.cyan(appName)} is not owned by an organization`)

  // Give implicit `view` access
  permissions.push('view')
  permissions = _.uniq(permissions.sort())

  let request = heroku.patch(`/organizations/apps/${appName}/collaborators/${context.args.email}`, {
    body: { permissions: permissions }
  })
  yield cli.action(`Updating ${context.args.email} in application ${cli.color.cyan(appName)} with ${permissions} permissions`, request)
}

module.exports = {
  topic: 'access',
  needsAuth: true,
  needsApp: true,
  command: 'update',
  description: 'Update existing collaborators in an org app',
  help: `Example:

    heroku access:update user@email.com --app APP --permissions deploy,manage,operate`,
  args: [{name: 'email', optional: false}],
  flags: [
    { name: 'permissions', hasValue: true, description: 'comma-delimited list of permissions to update (deploy,manage,operate)' },
    { name: 'privileges', hasValue: true, hidden: true }
  ],
  run: cli.command(co.wrap(run))
}
