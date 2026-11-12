import {Command, flags} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {App} from '@heroku/types/3.sdk'
import {ux} from '@oclif/core/ux'

import {createSDK} from '../../../lib/sdk.js'

export default class Refresh extends Command {
  static description = 'refresh ACM for an app'
  static enableJsonFlag = true
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }
  static topic = 'certs'

  public async run(): Promise<App> {
    const {platform} = createSDK(this.heroku)
    const {flags} = await this.parse(Refresh)

    ux.action.start('Refreshing Automatic Certificate Management')
    let refreshedApp: App
    try {
      refreshedApp = await platform.app.refreshACM(flags.app, {acm_refresh: true})
    } catch (error) {
      // Under --json, oclif's catch() leaves the spinner running and it swallows the error output.
      ux.action.stop(color.failure('!'))
      throw error
    }

    ux.action.stop()

    return refreshedApp
  }
}
