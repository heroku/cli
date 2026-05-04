import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core/ux'

import {getGeneration} from '../../../lib/apps/generation.js'
import {App, Formation} from '../../../lib/types/fir.js'

const METRICS_HOST = 'api.metrics.heroku.com'

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

    const [appResponse, formationResponse] = await Promise.all([
      this.heroku.get<App>(`/apps/${flags.app}`, {
        headers: {
          Accept: 'application/vnd.heroku+json; version=3.sdk',
        },
      }),
      this.heroku.get<Formation[]>(`/apps/${flags.app}/formation`, {
        headers: {
          Accept: 'application/vnd.heroku+json; version=3.sdk',
        },
      }),
    ])
    const app = appResponse.body
    const formations = formationResponse.body
    const webFormation = formations.find((f: any) => f.type === 'web')

    if (getGeneration(app) === 'fir') {
      throw new Error('Autoscaling is unavailable for apps in this space. See https://devcenter.heroku.com/articles/generations.')
    }

    if (!webFormation) throw new Error(`${flags.app} does not have any web dynos to scale`)

    const {size} = webFormation

    if (!isPerfOrPrivateTier(size || '')) {
      throw new Error('Autoscaling is only available with Performance or Private dynos')
    }

    const {body} = await this.heroku.get<Heroku.Formation[]>(`/apps/${app.id}/formation/web/monitors`, {
      hostname: METRICS_HOST,
    })
    const scaleMonitor = (body || []).find((m: any) => m.action_type === 'scale')

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

      await this.heroku.patch(
        `/apps/${app.id}/formation/web/monitors/${scaleMonitor.id}`,
        {
          body: updatedValues,
          hostname: METRICS_HOST,
        },
      )
    } else {
      updatedValues = {
        ...updatedValues,
        max_quantity: flags.max,
        min_quantity: flags.min,
        name: 'LATENCY_SCALE',
        value: flags.p95 || 1000,
      }

      await this.heroku.post(`/apps/${app.id}/formation/web/monitors`, {
        body: updatedValues,
        hostname: METRICS_HOST,
      })
    }

    ux.action.stop()
  }
}
