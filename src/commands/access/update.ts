import {Command, flags} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {appCollaboratorExtensions, NotATeamAppError} from '@heroku/sdk/extensions/platform'
import {Args, ux} from '@oclif/core'

import {createSDK} from '../../lib/sdk.js'

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
    const {platform} = createSDK(this.heroku, {extensions: [appCollaboratorExtensions]})

    let permissions = flags.permissions.split(',')
    permissions.push('view')
    permissions = [...new Set(permissions.sort())]

    ux.action.start(`Updating ${color.user(args.email)} in application ${color.app(appName)} with ${permissions} permissions`)
    try {
      await platform.appCollaborator.update(appName, args.email, {permissions})
    } catch (error) {
      if (error instanceof NotATeamAppError) {
        this.error(`Cannot update permissions. The app ${color.app(appName)} is not owned by a team`)
      }

      throw error
    }

    ux.action.stop()
  }
}
