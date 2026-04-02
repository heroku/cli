import {Command, flags} from '@heroku-cli/command'
import {HerokuAPIError} from '@heroku-cli/command/lib/api-client.js'
import * as Heroku from '@heroku-cli/schema'
import {color, hux} from '@heroku/heroku-cli-util'
import {ux} from '@oclif/core/ux'

import {lazyModuleLoader} from '../../lib/lazy-module-loader.js'
import {getOwner, isTeamApp} from '../../lib/teamUtils.js'

type AdminWithPermissions = Heroku.TeamMember & {
  permissions?: Heroku.TeamAppPermission[],
}

type MemberData = {
  email: string,
  permissions?: string
  role: string,
}

export default class AccessIndex extends Command {
  static description = 'list who has access to an app'
  static flags = {
    app: flags.app({required: true}),
    json: flags.boolean({description: 'output in json format'}),
    remote: flags.remote({char: 'r'}),
  }

  static topic = 'access'

  public async run(): Promise<void> {
    // Lazy-load lodash only when command runs
    const _ = await lazyModuleLoader.loadLodash()

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
        admins = _.forEach(admins, admin => {
          admin.user = {email: admin.email}
          admin.permissions = adminPermissions
          return admin
        })
        collaborators = buildCollaboratorsArray(collaborators, admins, _)
      } catch (error: any) {
        if (!(error instanceof HerokuAPIError && error.http.statusCode === 403))
          throw error
      }
    }

    if (json)
      printJSON(collaborators)
    else
      printAccess(app, collaborators, _)
  }
}

function buildCollaboratorsArray(collaboratorsRaw: Heroku.TeamAppCollaborator[], admins: Heroku.TeamMember[], _: any) {
  const collaboratorsNoAdmins = _.reject(collaboratorsRaw, {role: 'admin'})
  return _.union(collaboratorsNoAdmins, admins)
}

function buildTableColumns(showPermissions: boolean) {
  const baseColumns = {
    email: {
      get: ({email}: any): string => color.user(email),
    },
    role: {
      get: ({role}: any) => color.info(role),
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

function printAccess(app: Heroku.App, collaborators: any[], _: any) {
  const showPermissions = isTeamApp(app.owner?.email)
  collaborators = _.chain(collaborators)
    .sortBy((c: any) => c.email || c.user.email)
    .reject((c: any) => /herokumanager\.com$/.test(c.user.email))
    .map((collab: any) => {
      const {email} = collab.user
      const {permissions, role} = collab
      const data: MemberData = {email, role: role || 'collaborator'}
      if (showPermissions) {
        data.permissions = _.map(_.sortBy(permissions, 'name'), 'name').join(', ')
      }

      return data
    })
    .value()

  const tableColumns = buildTableColumns(showPermissions)
  hux.table(
    collaborators,
    tableColumns,
  )
}

function printJSON(collaborators: Heroku.TeamAppCollaborator[]) {
  ux.stdout(JSON.stringify(collaborators, null, 2))
}
