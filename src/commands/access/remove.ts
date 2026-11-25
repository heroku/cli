import {Command, flags} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {appCollaboratorExtensions} from '@heroku/sdk/extensions/platform'
import {ux} from '@oclif/core/ux'

import {createSDK} from '../../lib/sdk.js'

export default class AccessRemove extends Command {
  static description = 'remove users from a team app'
  static example = `${color.command('heroku access:remove user@email.com --app APP')}`
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote({char: 'r'}),
  }
  static strict = false
  static topic = 'access'

  public async run(): Promise<void> {
    const {argv, flags} = await this.parse(AccessRemove)
    const {app} = flags
    const email = argv[0] as string
    const appName = app
    const {platform} = createSDK(this.heroku, {extensions: [appCollaboratorExtensions]})

    ux.action.start(`Removing ${color.user(email)} access from the app ${color.app(appName)}`)
    await platform.appCollaborator.remove(appName, email)
    ux.action.stop()
  }
}
