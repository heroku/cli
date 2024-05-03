'use strict'

let cli = require('@heroku/heroku-cli-util')
let _ = require('lodash')
let Utils = require('../../lib/utils')
let error = require('../../lib/error')

async function run(context, heroku) {
  let appName = context.app
  let permissions = context.flags.permissions || context.flags.privileges
  if (!permissions) error.exit(1, 'Required flag:  --permissions PERMISSIONS')

  permissions = permissions.split(',')

  let appInfo = await heroku.get(`/apps/${appName}`)

  if (context.flags.privileges) cli.warn('DEPRECATION WARNING: use `--permissions` not `--privileges`')
  if (!Utils.isteamApp(appInfo.owner.email)) error.exit(1, `Error: cannot update permissions. The app ${cli.color.cyan(appName)} is not owned by a team`)

  // Give implicit `view` access
  permissions.push('view')
  permissions = _.uniq(permissions.sort())

  let request = heroku.patch(`/teams/apps/${appName}/collaborators/${context.args.email}`, {
    body: {permissions: permissions},
  })
  await cli.action(`Updating ${context.args.email} in application ${cli.color.cyan(appName)} with ${permissions} permissions`, request)
}

module.exports = {
  topic: 'access',
  needsAuth: true,
  needsApp: true,
  command: 'update',
  description: 'update existing collaborators on an team app',
  example: '$ heroku access:update user@email.com --app APP --permissions deploy,manage,operate',
  args: [{name: 'email', optional: false}],
  flags: [
    {name: 'permissions', char: 'p', hasValue: true, description: 'comma-delimited list of permissions to update (deploy,manage,operate)'},
    {name: 'privileges', hasValue: true, hidden: true},
  ],
  run: cli.command(run),
}
