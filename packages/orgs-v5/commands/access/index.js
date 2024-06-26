'use strict'

let cli = require('@heroku/heroku-cli-util')
let _ = require('lodash')
let Utils = require('../../lib/utils')

function printJSON(collaborators) {
  cli.log(JSON.stringify(collaborators, null, 2))
}

function printAccess(app, collaborators) {
  let showPermissions = Utils.isteamApp(app.owner.email)
  collaborators = _.chain(collaborators)
    .sortBy(c => c.email || c.user.email)
    .reject(c => /herokumanager\.com$/.test(c.user.email))
    .map(collab => {
      let email = collab.user.email
      let role = collab.role
      let data = {email: email, role: role || 'collaborator'}

      if (showPermissions) {
        data.permissions = _.map(_.sortBy(collab.permissions, 'name'), 'name')
      }

      return data
    }).value()

  let columns = [
    {key: 'email', label: 'Email', format: e => cli.color.cyan(e)},
    {key: 'role', label: 'Role', format: r => cli.color.green(r)},
  ]
  if (showPermissions) columns.push({key: 'permissions', label: 'Permissions'})
  cli.table(collaborators, {printHeader: false, columns})
}

async function run(context, heroku) {
  let appName = context.app

  let app = await heroku.get(`/apps/${appName}`)
  let isTeamApp = Utils.isteamApp(app.owner.email)
  let collaborators = await heroku.get(`/apps/${appName}/collaborators`)

  if (isTeamApp) {
    let teamName = Utils.getOwner(app.owner.email)

    try {
      const members = await heroku.get(`/teams/${teamName}/members`)
      let admins = members.filter(member => member.role === 'admin')

      let adminPermissions = await heroku.get('/teams/permissions')

      admins = _.forEach(admins, function (admin) {
        admin.user = {email: admin.email}
        admin.permissions = adminPermissions
        return admin
      })

      collaborators = _.reject(collaborators, {role: 'admin'}) // Admins might have already permissions
      collaborators = _.union(collaborators, admins)
    } catch (error) {
      if (error.statusCode !== 403) throw error
    }
  }

  if (context.flags.json) printJSON(collaborators)
  else printAccess(app, collaborators)
}

module.exports = [
  {
    topic: 'access',
    description: 'list who has access to an app',
    needsAuth: true,
    needsApp: true,
    flags: [
      {name: 'json', description: 'output in json format'},
    ],
    run: cli.command(run),
  },
  {
    topic: 'sharing',
    command: 'access',
    help: 'This command is now heroku access',
    variableArgs: true,
    hidden: true,
    run: () => {
      cli.error(`This command is now ${cli.color.cyan('heroku access')}`)
      process.exit(1)
    },
  },
]
