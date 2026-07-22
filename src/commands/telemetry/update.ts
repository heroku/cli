import type {TelemetryDrainUpdateOpts} from '@heroku/types/3.sdk'

import {Command, flags as Flags} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {HerokuSDK} from '@heroku/sdk'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import {displayTelemetryDrain, validateAndFormatSignals} from '../../lib/telemetry/util.js'

const heredoc = tsheredoc.default

export default class Update extends Command {
  static args = {
    telemetry_drain_id: Args.string({description: 'ID of the drain to update', required: true}),
  }
  static description = 'updates a telemetry drain with provided attributes (attributes not provided remain unchanged)'
  static example = `${color.command('heroku telemetry:update acde070d-8c4c-4f0d-9d8a-162843c10333 --signals logs,metrics --endpoint https://my-new-endpoint.com')}`
  static flags = {
    endpoint: Flags.string({description: 'drain url'}),
    headers: Flags.string({description: 'custom headers to configure the drain in json format'}),
    signals: Flags.string({description: 'comma-delimited list of signals to collect (traces, metrics, logs). Use "all" to collect all signals.'}),
    transport: Flags.string({description: 'transport protocol for the drain', options: ['http', 'grpc']}),
  }
  static topic = 'telemetry'

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Update)
    const {telemetry_drain_id} = args
    const {endpoint, headers, signals, transport} = flags
    const {platform} = new HerokuSDK()
    if (!(endpoint || headers || signals || transport)) {
      ux.error(heredoc(`
        Requires either --signals, --endpoint, --transport or HEADERS to be provided.
        See more help with --help
      `))
    }

    const drainConfig: TelemetryDrainUpdateOpts = {}
    if (signals) {
      drainConfig.signals = validateAndFormatSignals(signals)
    }

    if (headers || endpoint || transport) {
      const exporter: NonNullable<TelemetryDrainUpdateOpts['exporter']> = {} as any
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
    const telemetryDrain = await platform.telemetryDrain.update(telemetry_drain_id, drainConfig)
    ux.action.stop()

    await displayTelemetryDrain(telemetryDrain, platform)
  }
}
