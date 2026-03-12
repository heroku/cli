import {color} from '@heroku/heroku-cli-util'
import {Command} from '@heroku-cli/command'
import {Args} from '@oclif/core'

import {displayTelemetryDrain} from '../../lib/telemetry/util.js'
import {TelemetryDrain} from '../../lib/types/telemetry.js'

export default class Info extends Command {
  static args = {
    telemetry_drain_id: Args.string({description: 'ID of the drain to show info for', required: true}),
  }

  static description = 'show a telemetry drain\'s info'
  static example = `${color.command('heroku telemetry:info 022e2e2e-2e2e-2e2e-2e2e-2e2e2e2e2e2e')}`

  static topic = 'telemetry'

  public async run(): Promise<void> {
    const {args} = await this.parse(Info)
    const {telemetry_drain_id} = args

    const {body: telemetryDrain} =  await this.heroku.get<TelemetryDrain>(`/telemetry-drains/${telemetry_drain_id}`, {
      headers: {
        Accept: 'application/vnd.heroku+json; version=3.sdk',
      },
    })
    await displayTelemetryDrain(telemetryDrain, this.heroku)
  }
}
