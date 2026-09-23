import {Command, flags} from '@heroku-cli/command'
import {HerokuSDK} from '@heroku/sdk'
import {ux} from '@oclif/core/ux'

import {sdkClientOptions} from '../../../lib/apps/client-options.js'

export default class Disable extends Command {
  static description = 'disable web dyno autoscaling'
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }
  static topic = 'ps:autoscale'

  async run() {
    const {flags} = await this.parse(Disable)
    ux.action.start('Disabling dyno autoscaling')

    const {platform} = new HerokuSDK({clientOptions: sdkClientOptions(this.heroku)})
    const {metrics} = new HerokuSDK({clientOptions: {token: this.heroku.auth}})

    const app = await platform.app.info(flags.app)
    const monitors = await metrics.formationMonitor.list(app.id, 'web')
    const scaleMonitor = (monitors || []).find(m => m.action_type === 'scale')

    if (!scaleMonitor) throw new Error(`${flags.app} does not have autoscale enabled`)

    await metrics.formationMonitor.update(app.id, 'web', scaleMonitor.id, {
      is_active: false,
      op: 'GREATER_OR_EQUAL',
      period: 1,
    })

    ux.action.stop()
  }
}
