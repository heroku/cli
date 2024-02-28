import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'
import HTTP from 'http-call'
import * as _ from 'lodash'
import {isTeamApp, getOwner} from '../../lib/access/access-utils'
import {table} from '@oclif/core/lib/cli-ux/styled/table'

type MemberData = {
  email: string,
  role: string,
  permissions?: Heroku.TeamAppPermission[]
}

function printJSON(collaborators: HTTP<unknown>) {
  ux.log(JSON.stringify(collaborators, null, 2))
}

function buildTableColumns(showPermissions: boolean) {
  const baseColumns = {
    Email: {
      get: ({email}: any): string => color.cyan(email),
    },
    Role: {
      get: ({role}: any) => color.green(role),
    },
  }

  if (showPermissions) {
    return {
      ...baseColumns,
      Permissions: {},
    }
  }

  return baseColumns
}

function printAccess(app: Heroku.App, collaborators) {
  const showPermissions = isTeamApp(app.owner?.email)
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

  const tableColumns = buildTableColumns(showPermissions)
  ux.table(
    collaborators,
    tableColumns,
  )
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
    const {flags, argv, args} = await this.parse(AccessIndex)
    const {app: appName, json} = flags
    const {body: app} = await this.heroku.get<Heroku.App>(`/apps/${appName}`)
    let {body: collaborators} = await this.heroku.get<Heroku.TeamAppCollaborator[]>(`/apps/${appName}/collaborators`)
    if (isTeamApp(app.owner?.email)) {
      const teamName = getOwner(app.owner?.email)
      try {
        const {body: members} = await this.heroku.get<Heroku.TeamMember[]>(`/teams/${teamName}/members`)
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
