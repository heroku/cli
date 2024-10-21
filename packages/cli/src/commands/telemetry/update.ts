import {flags as Flags, Command} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import {TelemetryDrain, TelemetryDrainWithOptionalKeys, TelemetryExporterWithOptionalKeys} from '../../lib/types/telemetry'
import heredoc from 'tsheredoc'
import {validateAndFormatSignal} from '../../lib/telemetry/util'

export default class Update extends Command {
  static topic = 'telemetry'
  static description = 'updates a telemetry drain'
  static args = {
    telemetry_drain_id: Args.string({required: true, description: 'ID of the drain to update'}),
    headers: Args.string({description: 'custom headers to configure the drain in json format'}),
  }

  static flags = {
    signal: Flags.string({default: 'all', description: 'comma-delimited list of signals to collect (traces, metrics, logs). Use "all" to collect all signals.'}),
    endpoint: Flags.string({description: 'drain url'}),
    transport: Flags.string({options: ['http', 'gprc'], description: 'transport protocol for the drain'}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Update)
    const {telemetry_drain_id, headers} = args
    const {signal, endpoint, transport} = flags
    if (!(headers || signal || endpoint || transport)) {
      ux.error(heredoc(`
        Requires either --signal, --endpoint, --transport or HEADERS to be provided.
        See more help with --help
      `))
    }

    const drainConfig: TelemetryDrainWithOptionalKeys = {}
    if (signal) {
      drainConfig.signals = validateAndFormatSignal(signal)
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
        exporter.type = `otlp${transport}`
      }

      drainConfig.exporter = exporter
    }

    const {body: telemetryDrain} = await this.heroku.patch<TelemetryDrain>(`/telemetry-drains/${telemetry_drain_id}`, {
      headers: {
        Accept: 'application/vnd.heroku+json; version=3.sdk',
      },
      body: drainConfig,
    })
    ux.action.start(`Updating telemetry drain ${telemetry_drain_id}, which was configured for ${telemetryDrain.owner.type} ${telemetryDrain.owner.name}`)
    ux.action.stop()
  }
}
