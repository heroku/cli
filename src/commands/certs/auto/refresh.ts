import {Command, flags} from '@heroku-cli/command'
import {App} from '@heroku/types/3.sdk'
import {ux} from '@oclif/core/ux'

import {createSDK} from '../../../lib/sdk.js'

export default class Refresh extends Command {
  static description = 'refresh ACM for an app'
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }
  static topic = 'certs'

  public async run(): Promise<App> {
    const {platform} = createSDK(this.heroku)
    const {flags} = await this.parse(Refresh)

    ux.action.start('Refreshing Automatic Certificate Management')
    const refreshedApp = await platform.app.refreshACM(flags.app, {acm_refresh: true})
    ux.action.stop()

    return refreshedApp
  }
}
