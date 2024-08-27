import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'
import * as _ from 'lodash'
import {isTeamApp, getOwner} from '../../lib/teamUtils'

type MemberData = {
  email: string,
  role: string,
  permissions?: string
}

type AdminWithPermissions = Heroku.TeamMember & {
  permissions?: Heroku.TeamAppPermission[],
}

function printJSON(collaborators: Heroku.TeamAppCollaborator[]) {
  ux.log(JSON.stringify(collaborators, null, 2))
}

function buildTableColumns(showPermissions: boolean) {
  const baseColumns = {
    email: {
      get: ({email}: any): string => color.cyan(email),
    },
    role: {
      get: ({role}: any) => color.green(role),
    },
  }

  if (showPermissions) {
    return {
      ...baseColumns,
      permissions: {},
    }
  }

  return baseColumns
}

function printAccess(app: Heroku.App, collaborators: any[]) {
  const showPermissions = isTeamApp(app.owner?.email)
  collaborators = _.chain(collaborators)
    .sortBy(c => c.email || c.user.email)
    .reject(c => /herokumanager\.com$/.test(c.user.email))
    .map(collab => {
      const email = collab.user.email
      const role = collab.role
      const data: MemberData = {email: email, role: role || 'collaborator'}
      if (showPermissions) {
        data.permissions = _.map(_.sortBy(collab.permissions, 'name'), 'name').join(', ')
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

function buildCollaboratorsArray(collaboratorsRaw: Heroku.TeamAppCollaborator[], admins: Heroku.TeamMember[]) {
  const collaboratorsNoAdmins = _.reject(collaboratorsRaw, {role: 'admin'})
  return _.union(collaboratorsNoAdmins, admins)
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
    const {flags} = await this.parse(AccessIndex)
    const {app: appName, json} = flags
    const {body: app} = await this.heroku.get<Heroku.App>(`/apps/${appName}`)
    let {body: collaborators} = await this.heroku.get<Heroku.TeamAppCollaborator[]>(`/apps/${appName}/collaborators`)
    if (isTeamApp(app.owner?.email)) {
      const teamName = getOwner(app.owner?.email)
      try {
        const {body: members} = await this.heroku.get<Heroku.TeamMember[]>(`/teams/${teamName}/members`)
        let admins: AdminWithPermissions[] = members.filter(member => member.role === 'admin')
        const {body: adminPermissions} = await this.heroku.get<Heroku.TeamAppPermission[]>('/teams/permissions')
        admins = _.forEach(admins, function (admin) {
          admin.user = {email: admin.email}
          admin.permissions = adminPermissions
          return admin
        })
        collaborators = buildCollaboratorsArray(collaborators, admins)
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
