import {Command, flags} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {accountExtensions, formatDelinquencyWarning} from '@heroku/sdk/extensions/platform'
import {ux} from '@oclif/core/ux'

import {createSDK} from '../../lib/sdk.js'

export default class Leave extends Command {
  static aliases = ['leave']
  static description = 'remove yourself from a team app'
  static example = `${color.command('heroku apps:leave -a APP')}`
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }
  static topic = 'apps'

  public async run(): Promise<void> {
    const {flags} = await this.parse(Leave)
    const {app} = flags
    const {platform} = createSDK(this.heroku, {extensions: [accountExtensions]})
    const {account, delinquency} = await platform.account.getWithDelinquency()
    const delinquencyWarning = formatDelinquencyWarning('account', delinquency)
    if (delinquencyWarning) this.warn(delinquencyWarning)
    ux.action.start(`Leaving ${color.app(app)}`)
    await this.heroku.delete(`/apps/${app}/collaborators/${encodeURIComponent(account.email as string)}`)
    ux.action.stop()
  }
}
