import {Command, flags} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {teamAppExtensions} from '@heroku/sdk/extensions/platform'
import {ux} from '@oclif/core/ux'

import {createSDK} from '../../lib/sdk.js'

export default class AppsJoin extends Command {
  static aliases = ['join']
  static description = 'add yourself to a team app'
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote({char: 'r'}),
  }
  static topic = 'apps'

  public async run(): Promise<void> {
    const {flags} = await this.parse(AppsJoin)
    const {app} = flags
    ux.action.start(`Joining ${color.app(app)}`)
    const {platform} = createSDK(this.heroku, {extensions: [teamAppExtensions]})
    await platform.teamApp.joinSelf(app)
    ux.action.stop()
  }
}
