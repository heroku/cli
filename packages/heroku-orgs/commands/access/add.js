'use strict'

let cli = require('heroku-cli-util')
let _ = require('lodash')
let Utils = require('../../lib/utils')
let co = require('co')
let error = require('../../lib/error')

function * run (context, heroku) {
  let appName = context.app
  let permissions = context.flags.permissions || context.flags.privileges || ''
  let appInfo = yield heroku.get(`/apps/${appName}`)
  let output = `Adding ${cli.color.cyan(context.args.email)} access to the app ${cli.color.magenta(appName)}`
  let request
  let orgFeatures = []

  if (Utils.isOrgApp(appInfo.owner.email)) {
    let orgName = Utils.getOwner(appInfo.owner.email)
    orgFeatures = yield heroku.get(`/organizations/${orgName}/features`)
  }

  if (orgFeatures.find(feature => feature.name === 'org-access-controls')) {
    if (!permissions) error.exit(1, 'Missing argument: permissions')

    if (context.flags.privileges) cli.warn('DEPRECATION WARNING: use `--permissions` not `--privileges`')

    permissions = permissions.split(',')

    // Give implicit `view` access
    permissions.push('view')
    permissions = _.uniq(permissions.sort())
    output += ` with ${cli.color.green(permissions)} permissions`

    request = heroku.post(`/organizations/apps/${appName}/collaborators`, {
      body: { user: context.args.email, permissions: permissions }
    })
  } else {
    request = heroku.post(`/apps/${appName}/collaborators`, {body: { user: context.args.email }})
  }
  yield cli.action(`${output}`, request)
}

module.exports = [
  {
    topic: 'access',
    needsAuth: true,
    needsApp: true,
    command: 'add',
    description: 'Add new users to your app',
    help: `Examples:

    heroku access:add user@email.com --app APP # Add a collaborator to your app
    heroku access:add user@email.com --app APP --permissions deploy,manage,operate # permissions must be comma separated`,
    args: [{name: 'email', optional: false}],
    flags: [
      {name: 'permissions', description: 'list of permissions comma separated', hasValue: true, optional: true},
      {name: 'privileges', hasValue: true, optional: true, hidden: true} // Deprecated flag
    ],
    run: cli.command(co.wrap(run))
  }, {
    topic: 'sharing',
    command: 'add',
    help: `this command is now heroku access:add`,
    variableArgs: true,
    hidden: true,
    run: () => {
      cli.error(`This command is now ${cli.color.cyan('heroku access:add')}`)
      process.exit(1)
    }
  }
]
