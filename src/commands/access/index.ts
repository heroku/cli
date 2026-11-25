import {Command, flags} from '@heroku-cli/command'
import {color, hux} from '@heroku/heroku-cli-util'
import {type AdminCollaborator, appCollaboratorExtensions} from '@heroku/sdk/extensions/platform'
import {Collaborator} from '@heroku/types/3.sdk'
import {ux} from '@oclif/core/ux'

import {lazyModuleLoader} from '../../lib/lazy-module-loader.js'
import {createSDK} from '../../lib/sdk.js'

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
    const _ = await lazyModuleLoader.loadLodash()

    const {flags} = await this.parse(AccessIndex)
    const {app: appName, json} = flags
    const {platform} = createSDK(this.heroku, {extensions: [appCollaboratorExtensions]})
    const collaborators = await platform.appCollaborator.list(appName)

    if (json)
      printJSON(collaborators)
    else
      printAccess(collaborators, _)
  }
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

function printAccess(collaborators: Array<AdminCollaborator | Collaborator>, _: any) {
  const showPermissions = collaborators.some(c => c.permissions !== undefined)
  const rows = _.chain(collaborators)
    .sortBy((c: any) => c.user.email)
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
  ux.stdout(hux.table(
    rows,
    tableColumns,
  ))
}

function printJSON(collaborators: Array<AdminCollaborator | Collaborator>) {
  ux.stdout(JSON.stringify(collaborators, null, 2))
}
