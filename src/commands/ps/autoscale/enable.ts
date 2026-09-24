import {Command, flags} from '@heroku-cli/command'
import {HerokuSDK} from '@heroku/sdk'
import {ux} from '@oclif/core/ux'

import {sdkClientOptions} from '../../../lib/apps/client-options.js'
import {getGeneration} from '../../../lib/apps/generation.js'

const isPerfOrPrivateTier = (size: string) => {
  const applicableTiers = ['performance', 'private', 'shield']
  return applicableTiers.some(tier => size.toLowerCase().includes(tier))
}

export default class Enable extends Command {
  static description = 'enable web dyno autoscaling'
  static flags = {
    app: flags.app({required: true}),
    max: flags.integer({description: 'maximum number of dynos', required: true}),
    min: flags.integer({description: 'minimum number of dynos', required: true}),
    notifications: flags.boolean({description: 'receive email notifications when the max dyno limit is reached'}),
    p95: flags.integer({description: 'desired p95 response time'}),
    remote: flags.remote(),
  }
  static topic = 'ps:autoscale'

  async run() {
    const {flags} = await this.parse(Enable)
    ux.action.start('Enabling dyno autoscaling')

    const {platform} = new HerokuSDK({clientOptions: sdkClientOptions(this.heroku)})
    const {metrics} = new HerokuSDK({clientOptions: {token: this.heroku.auth}})

    const [app, formations] = await Promise.all([
      platform.app.info(flags.app),
      platform.formation.list(flags.app),
    ])
    const webFormation = formations.find(f => f.type === 'web')

    if (getGeneration(app) === 'fir') {
      throw new Error('Autoscaling is unavailable for apps in this space. See https://devcenter.heroku.com/articles/generations.')
    }

    if (!webFormation) throw new Error(`${flags.app} does not have any web dynos to scale`)

    const {size} = webFormation

    if (!isPerfOrPrivateTier(size || '')) {
      throw new Error('Autoscaling is only available with Performance or Private dynos')
    }

    const monitors = await metrics.formationMonitor.list(app.id, 'web')
    const scaleMonitor = (monitors || []).find(m => m.action_type === 'scale')

    let updatedValues: any = {
      action_type: 'scale',
      is_active: true,
      notification_channels: flags.notifications ? ['app'] : [],
      notification_period: 1440,
      op: 'GREATER_OR_EQUAL',
      period: 1,
    }

    if (scaleMonitor) {
      updatedValues = {
        ...updatedValues,
        max_quantity: flags.max || scaleMonitor.max_quantity,
        min_quantity: flags.min || scaleMonitor.min_quantity,
        value: flags.p95 || scaleMonitor.value,
      }

      await metrics.formationMonitor.update(app.id, 'web', scaleMonitor.id, updatedValues)
    } else {
      updatedValues = {
        ...updatedValues,
        max_quantity: flags.max,
        min_quantity: flags.min,
        name: 'LATENCY_SCALE',
        value: flags.p95 || 1000,
      }

      await metrics.formationMonitor.create(app.id, 'web', updatedValues)
    }

    ux.action.stop()
  }
}
