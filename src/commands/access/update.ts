import {color} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Args, ux} from '@oclif/core'

import {isTeamApp} from '../../lib/teamUtils.js'

export default class Update extends Command {
  static args = {
    email: Args.string({description: 'email address of the team member', required: true}),
  }

  static description = 'update existing collaborators on an team app'
  static flags = {
    app: flags.app({required: true}),
    permissions: flags.string({
      char: 'p',
      description: 'comma-delimited list of permissions to update (deploy,manage,operate)',
      required: true,
    }),
    remote: flags.remote(),
  }

  static topic = 'access'

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Update)
    const appName = flags.app
    let permissions = flags.permissions.split(',')

    const {body: appInfo} = await this.heroku.get<Heroku.App>(`/apps/${appName}`)
    if (!isTeamApp(appInfo?.owner?.email))
      this.error(`Error: cannot update permissions. The app ${color.app(appName)} is not owned by a team`)
    permissions.push('view')
    permissions = Array.from(new Set(permissions.sort()))

    ux.action.start(`Updating ${color.user(args.email)} in application ${color.app(appName)} with ${permissions} permissions`)
    await this.heroku.patch(`/teams/apps/${appName}/collaborators/${args.email}`, {
      body: {permissions},
    })
    ux.action.stop()
  }
}
