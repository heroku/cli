import {Command, flags} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {ux} from '@oclif/core/ux'

import {createSDK} from '../../lib/sdk.js'

export default class AppsLock extends Command {
  static aliases = ['lock']
  static description = 'prevent team members from joining an app'
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }
  static topic = 'apps'

  public async run(): Promise<void> {
    const {flags} = await this.parse(AppsLock)
    const {app} = flags
    const {platform} = createSDK(this.heroku)
    const appResponse = await platform.teamApp.info(app)
    const appName = appResponse.name ?? app
    if (appResponse.locked) {
      throw new Error(`Error: cannot lock ${color.app(appName)}.\nThis app is already locked.`)
    }

    ux.action.start(`Locking ${color.app(appName)}`)

    await platform.teamApp.updateLocked(appName, {locked: true})
    ux.action.stop()
  }
}
