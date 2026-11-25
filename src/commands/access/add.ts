import {Command, flags} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {appCollaboratorExtensions, isTeamOwned} from '@heroku/sdk/extensions/platform'
import {Args, ux} from '@oclif/core'

import {createSDK} from '../../lib/sdk.js'

export default class AccessAdd extends Command {
  static args = {
    email: Args.string({description: 'email address of the team member', required: true}),
  }
  static description = 'add new users to your app'
  static examples = [
    `${color.command('heroku access:add user@email.com --app APP')} # add a collaborator to your app`,
    `${color.command('heroku access:add user@email.com --app APP --permissions deploy,manage,operate')} # permissions must be comma separated`,
  ]
  static flags = {
    app: flags.app({required: true}),
    permissions: flags.string({char: 'p', description: 'list of permissions comma separated'}),
    remote: flags.remote({char: 'r'}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(AccessAdd)
    const {email} = args
    const {app: appName, permissions} = flags
    const {platform} = createSDK(this.heroku, {extensions: [appCollaboratorExtensions]})

    let output = `Adding ${color.user(email)} access to the app ${color.app(appName)}`

    const app = await platform.app.info(appName)
    const permissionsArray = permissions
      ? permissions.split(',').map((permission: string) => permission.trim()).filter(Boolean)
      : undefined

    if (isTeamOwned(app) && permissionsArray) {
      const normalizedPermissions = [...new Set(['view', ...permissionsArray])].sort()
      output += ` with ${color.green(normalizedPermissions.join(', '))} permissions`
    }

    ux.action.start(output)
    await platform.appCollaborator.add(appName, email, {permissions: permissionsArray})
    ux.action.stop()
  }
}
