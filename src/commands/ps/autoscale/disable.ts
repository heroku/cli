import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core/ux'

import {createSDK} from '../../../lib/sdk.js'

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

    const {metrics, platform} = createSDK(this.heroku)

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
