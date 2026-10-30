import {Command, flags} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {ux} from '@oclif/core/ux'

import {createSDK} from '../../lib/sdk.js'

export default class Unlock extends Command {
  static aliases = ['unlock']
  static description = 'unlock an app so any team member can join'
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }
  static topic = 'apps'

  public async run(): Promise<void> {
    const {flags} = await this.parse(Unlock)
    const {app} = flags
    const {platform} = createSDK(this.heroku)
    const appResponse = await platform.teamApp.info(app)
    const appName = appResponse.name ?? app
    if (!appResponse.locked) {
      ux.error(`cannot unlock ${color.app(appName)}\nThis app is not locked.`, {exit: 1})
    }

    ux.action.start(`Unlocking ${color.app(appName)}`)
    await platform.teamApp.updateLocked(appName, {locked: false})
    ux.action.stop()
  }
}
