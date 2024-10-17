import {Command} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import {TelemetryDrain} from '../../lib/types/telemetry'

export default class Info extends Command {
  static topic = 'telemetry'
  static description = 'show a telemetry drain\'s info'
  static args = {
    telemetry_drain_id: Args.string({required: true, description: 'ID of the drain to show info for'}),
  };

  public async run(): Promise<void> {
    const {args} = await this.parse(Info)
    const {telemetry_drain_id} = args

    const {body: telemetryDrain} =  await this.heroku.get<TelemetryDrain>(`/telemetry-drains/${telemetry_drain_id}`, {
      headers: {
        Accept: 'application/vnd.heroku+json; version=3.sdk',
      },
    })
    this.display(telemetryDrain)
  }

  protected display(telemetryDrain: TelemetryDrain) {
    ux.styledHeader(telemetryDrain.id)
    const drainType = telemetryDrain.owner.type.charAt(0).toUpperCase() + telemetryDrain.owner.type.slice(1)
    ux.styledObject({
      [drainType]: telemetryDrain.owner.name,
      Signals: telemetryDrain.capabilities.join(', '),
      Endpoint: telemetryDrain.exporter.endpoint,
      Kind: telemetryDrain.exporter.type,
      Headers: telemetryDrain.exporter.headers,
    }, ['App', 'Space', 'Signals', 'Endpoint', 'Kind', 'Headers'])
  }
}
