import {flags as Flags, Command} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import {TelemetryDrain, TelemetryDrainWithOptionalKeys, TelemetryExporterWithOptionalKeys} from '../../lib/types/telemetry'
import heredoc from 'tsheredoc'
import {displayTelemetryDrain, validateAndFormatSignals} from '../../lib/telemetry/util'

export default class Update extends Command {
  static topic = 'telemetry'
  static description = 'updates a telemetry drain with provided attributes (attributes not provided remain unchanged)'
  static args = {
    telemetry_drain_id: Args.string({required: true, description: 'ID of the drain to update'}),
  }

  static flags = {
    endpoint: Flags.string({description: 'drain url'}),
    headers: Flags.string({description: 'custom headers to configure the drain in json format'}),
    signals: Flags.string({description: 'comma-delimited list of signals to collect (traces, metrics, logs). Use "all" to collect all signals.'}),
    transport: Flags.string({options: ['http', 'grpc'], description: 'transport protocol for the drain'}),
  }

  static example = heredoc(`
    $ heroku telemetry:update acde070d-8c4c-4f0d-9d8a-162843c10333 --signals logs,metrics --endpoint https://my-new-endpoint.com
  `)

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Update)
    const {telemetry_drain_id} = args
    const {endpoint, headers, signals, transport} = flags
    if (!(endpoint || headers || signals || transport)) {
      ux.error(heredoc(`
        Requires either --signals, --endpoint, --transport or HEADERS to be provided.
        See more help with --help
      `))
    }

    const drainConfig: TelemetryDrainWithOptionalKeys = {}
    if (signals) {
      drainConfig.signals = validateAndFormatSignals(signals)
    }

    if (headers || endpoint || transport) {
      const exporter: TelemetryExporterWithOptionalKeys = {}
      if (headers) {
        exporter.headers = JSON.parse(headers)
      }

      if (endpoint) {
        exporter.endpoint = endpoint
      }

      if (transport) {
        exporter.type = (transport === 'grpc') ? 'otlp' : 'otlphttp'
      }

      drainConfig.exporter = exporter
    }

    ux.action.start(`Updating telemetry drain ${telemetry_drain_id}`)
    const {body: telemetryDrain} = await this.heroku.patch<TelemetryDrain>(`/telemetry-drains/${telemetry_drain_id}`, {
      headers: {
        Accept: 'application/vnd.heroku+json; version=3.sdk',
      },
      body: drainConfig,
    })
    ux.action.stop()

    await displayTelemetryDrain(telemetryDrain, this.heroku)
  }
}
