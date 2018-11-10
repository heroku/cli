import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {cli} from 'cli-ux'

const METRICS_HOST = 'api.metrics.heroku.com'

export default class Disable extends Command {
  static description = 'disable web dyno autoscaling'
  static flags = {
    app: flags.app({required: true})
  }

  async run() {
    const {flags} = this.parse(Disable)
    cli.action.start('Disabling dyno autoscaling')

    const appResponse = await this.heroku.get<Heroku.App>(`/apps/${flags.app}`)
    const app = appResponse.body
    const monitorsResponse = await this.heroku.get<Heroku.Formation>(`/apps/${app.id}/formation/web/monitors`, {
      hostname: METRICS_HOST
    })
    const monitors = monitorsResponse.body
    const scaleMonitor = monitors.find((m: any) => m.action_type === 'scale')

    if (!scaleMonitor) throw new Error(`${flags.app} does not have autoscale enabled`)

    await this.heroku.patch(`/apps/${app.id}/formation/web/monitors/${scaleMonitor.id}`, {
      hostname: METRICS_HOST,
      body: {
        is_active: false,
        period: 1,
        op: 'GREATER_OR_EQUAL'
      }
    })

    cli.action.stop()
  }
}
