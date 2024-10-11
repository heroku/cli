import {Command} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import {TelemetryDrain} from '../../lib/types/telemetry'

export default class Remove extends Command {
  static topic = 'telemetry'
  static description = 'remove a telemetry drain'
  static args = {
    telemetry_drain_id: Args.string({required: true, description: 'ID of the drain to remove'}),
  };

  public async run(): Promise<void> {
    const {args} = await this.parse(Remove)
    const {telemetry_drain_id} = args
    const {body: telemetryDrain} =  await this.heroku.get<TelemetryDrain>(`/telemetry-drains/${telemetry_drain_id}`, {
      headers: {
        Accept: 'application/vnd.heroku+json; version=3.fir',
      },
    })

    ux.action.start(`Removing telemetry drain ${telemetry_drain_id}, which was configured for ${telemetryDrain.owner.type} ${telemetryDrain.owner.name}`)

    await this.heroku.delete<TelemetryDrain>(`/telemetry-drains/${telemetry_drain_id}`, {
      headers: {
        Accept: 'application/vnd.heroku+json; version=3.fir',
      },
    })

    ux.action.stop()
  }
}
