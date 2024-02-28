import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'

let _ = require('lodash')
let Utils = require('../../lib/utils')
function printJSON(collaborators) {
  ux.log(JSON.stringify(collaborators, null, 2))
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
    })
    .value()
  let columns = [
    {key: 'email', label: 'Email', format: e => color.cyan(e)}, {key: 'role', label: 'Role', format: r => color.green(r)},
  ]
  if (showPermissions)
    columns.push({key: 'permissions', label: 'Permissions'})
  cli.table(collaborators, {printHeader: false, columns})
}

export default class Index extends Command {
  public async run(): Promise<void> {
    const {flags, argv, args} = await this.parse(Index)
    let appName = app
    let app = await this.heroku.get(`/apps/${appName}`)
    let isTeamApp = Utils.isteamApp(app.owner.email)
    let collaborators = await this.heroku.get(`/apps/${appName}/collaborators`)
    if (isTeamApp) {
      let teamName = Utils.getOwner(app.owner.email)
      try {
        const members = await this.heroku.get(`/teams/${teamName}/members`)
        let admins = members.filter(member => member.role === 'admin')
        let adminPermissions = await this.heroku.get('/teams/permissions')
        admins = _.forEach(admins, function (admin) {
          admin.user = {email: admin.email}
          admin.permissions = adminPermissions
          return admin
        })
        collaborators = _.reject(collaborators, {role: 'admin'})
        collaborators = _.union(collaborators, admins)
      } catch (error) {
        if (error.statusCode !== 403)
          throw error
      }
    }

    if (flags.json)
      printJSON(collaborators)
    else
      printAccess(app, collaborators)
  }
}
