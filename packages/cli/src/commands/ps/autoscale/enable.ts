import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'

const METRICS_HOST = 'api.metrics.heroku.com'

const isPerfOrPrivateTier = (size: string) => {
  const applicableTiers = ['performance', 'private', 'shield']
  return applicableTiers.some(tier => size.toLowerCase().includes(tier))
}

export default class Enable extends Command {
  static description = 'enable web dyno autoscaling'

  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
    min: flags.integer({required: true, description: 'minimum number of dynos'}),
    max: flags.integer({required: true, description: 'maximum number of dynos'}),
    p95: flags.integer({description: 'desired p95 response time'}),
    notifications: flags.boolean({description: 'receive email notifications when the max dyno limit is reached'}),
  }

  async run() {
    const {flags} = await this.parse(Enable)
    ux.action.start('Enabling dyno autoscaling')

    const [appResponse, formationResponse] = await Promise.all([
      this.heroku.get<Heroku.App>(`/apps/${flags.app}`),
      this.heroku.get<Heroku.Formation[]>(`/apps/${flags.app}/formation`),
    ])
    const app = appResponse.body
    const formations = formationResponse.body
    const webFormation = formations.find((f: any) => f.type === 'web')
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
      is_active: true,
      action_type: 'scale',
      notification_period: 1440,
      op: 'GREATER_OR_EQUAL',
      period: 1,
      notification_channels: flags.notifications ? ['app'] : [],
    }

    if (scaleMonitor) {
      updatedValues = {...updatedValues,
        min_quantity: flags.min || scaleMonitor.min_quantity,
        max_quantity: flags.max || scaleMonitor.max_quantity,
        value: flags.p95 ? flags.p95 : scaleMonitor.value,
      }

      await this.heroku.patch(`/apps/${app.id}/formation/web/monitors/${scaleMonitor.id}`,
        {
          body: updatedValues,
          hostname: METRICS_HOST,
        })
    } else {
      updatedValues = {...updatedValues,
        name: 'LATENCY_SCALE',
        min_quantity: flags.min,
        max_quantity: flags.max,
        value: flags.p95 ? flags.p95 : 1000,
      }

      await this.heroku.post(`/apps/${app.id}/formation/web/monitors`, {
        hostname: METRICS_HOST,
        body: updatedValues,
      })
    }

    ux.action.stop()
  }
}
