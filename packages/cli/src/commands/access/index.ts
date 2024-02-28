import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'
import HTTP from 'http-call'
import * as _ from 'lodash'

let Utils = require('../../lib/utils')

type MemberData = {
  email: string,
  role: string,
  permissions?: Heroku.TeamAppPermission[]
}

function printJSON(collaborators: HTTP<unknown>) {
  ux.log(JSON.stringify(collaborators, null, 2))
}

function printAccess(app: Heroku.App, collaborators) {
  const showPermissions = Utils.isteamApp(app.owner?.email)
  collaborators = _.chain(collaborators)
    .sortBy(c => c.email || c.user.email)
    .reject(c => /herokumanager\.com$/.test(c.user.email))
    .map(collab => {
      const email = collab.user.email
      const role = collab.role
      const data: MemberData = {email: email, role: role || 'collaborator'}
      if (showPermissions) {
        data.permissions = _.map(_.sortBy(collab.permissions, 'name'), 'name')
      }

      return data
    })
    .value()
  const columns = [
    {key: 'email', label: 'Email', format: (e: string) => color.cyan(e)}, {
      key: 'role',
      label: 'Role',
      format: (r: string) => color.green(r),
    },
  ]
  if (showPermissions)
    columns.push({key: 'permissions', label: 'Permissions'})
  cli.table(collaborators, {printHeader: false, columns})
}

export default class AccessIndex extends Command {
  static description = 'list who has access to an app'
  static topic = 'access'
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote({char: 'r'}),
    json: flags.boolean({description: 'output in json format'}),
  }

  public async run(): Promise<void> {
    const {flags, argv, args} = await this.parse(Index)
    const {app: appName, json} = flags
    const app = await this.heroku.get<Heroku.App>(`/apps/${appName}`)
    const isTeamApp = Utils.isteamApp(app.owner.email)
    let collaborators: HTTP<unknown> = await this.heroku.get(`/apps/${appName}/collaborators`)
    if (isTeamApp) {
      const teamName = Utils.getOwner(app.owner.email)
      try {
        const members = await this.heroku.get<Heroku.TeamMember[]>(`/teams/${teamName}/members`)
        let admins = members.filter((member: { role: string }) => member.role === 'admin')
        const adminPermissions = await this.heroku.get<Heroku.TeamAppPermission[]>('/teams/permissions')
        admins = _.forEach(admins, function (admin: { user: { email: any }; email: any; permissions: HTTP<Heroku.TeamAppPermission> }) {
          admin.user = {email: admin.email}
          admin.permissions = adminPermissions
          return admin
        })
        collaborators = _.reject(collaborators, {role: 'admin'})
        collaborators = _.union(collaborators, admins)
      } catch (error: any) {
        if (error.statusCode !== 403)
          throw error
      }
    }

    if (json)
      printJSON(collaborators)
    else
      printAccess(app, collaborators)
  }
}
