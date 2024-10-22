import {Command} from '@heroku-cli/command'
import {Args} from '@oclif/core'
import {TelemetryDrain} from '../../lib/types/telemetry'
import {displayTelemetryDrain} from '../../lib/telemetry/util'
export default class Info extends Command {
  static topic = 'telemetry'
  static description = 'show a telemetry drain\'s info'
  static args = {
    telemetry_drain_id: Args.string({required: true, description: 'ID of the drain to show info for'}),
  }

  static example = '$ heroku telemetry:info 022e2e2e-2e2e-2e2e-2e2e-2e2e2e2e2e2e'

  public async run(): Promise<void> {
    const {args} = await this.parse(Info)
    const {telemetry_drain_id} = args

    const {body: telemetryDrain} =  await this.heroku.get<TelemetryDrain>(`/telemetry-drains/${telemetry_drain_id}`, {
      headers: {
        Accept: 'application/vnd.heroku+json; version=3.sdk',
      },
    })
    displayTelemetryDrain(telemetryDrain)
  }
}
