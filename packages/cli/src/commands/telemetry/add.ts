import {Command, flags as Flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import {TelemetryDrain} from '../../lib/types/telemetry'
import heredoc from 'tsheredoc'
import {validateAndFormatSignals} from '../../lib/telemetry/util'
import {App, Space} from '@heroku-cli/schema'

export default class Add extends Command {
  static description = 'Add and configure a new telemetry drain. Defaults to collecting all telemetry unless otherwise specified.'

  static flags = {
    app: Flags.string({char: 'a', exactlyOne: ['app', 'space'], description: 'app to add a drain to'}),
    headers: Flags.string({description: 'custom headers to configure the drain in json format'}),
    space: Flags.string({char: 's', description: 'space to add a drain to'}),
    signals: Flags.string({default: 'all', description: 'comma-delimited list of signals to collect (traces, metrics, logs). Use "all" to collect all signals.'}),
    // If splunk transport is accepted as a feature, this should have options: ['http', 'grpc', 'splunk']
    transport: Flags.string({default: 'http', description: 'transport protocol for the drain'}),
  }

  static args = {
    endpoint: Args.string({required: true, description: 'drain url'}),
  }

  static example = heredoc(`
    Add a telemetry drain to an app to collect logs and traces:
    $ heroku telemetry:add https://my-endpoint.com --app myapp --signals logs,traces --headers '{"x-drain-example-team": "API_KEY", "x-drain-example-dataset": "METRICS_DATASET"}'
  `)

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Add)
    const {app, headers, space, signals, transport} = flags
    const {endpoint} = args

    // Allow splunk, but do not show splunk in error message until splunk transport is accepted as a feature
    // When splunk transport is accepted as a feature, and options are added for the transport flag, this section should be removed
    const publicTransports = ['http', 'grpc']
    const validTransports = [...publicTransports, 'splunk']
    if (!validTransports.includes(transport)) {
      throw new Error(`Expected --transport=${transport} to be one of: ${publicTransports.join(', ')}`)
    }

    let id
    if (app) {
      const {body: herokuApp} = await this.heroku.get<App>(
        `/apps/${app}`, {
          headers: {Accept: 'application/vnd.heroku+json; version=3.sdk'},
        })
      id = herokuApp.id
    } else {
      const {body: herokuSpace} = await this.heroku.get<Space>(`/spaces/${space}`)
      id = herokuSpace.id
    }

    const exporterHeaders = headers || '{}'
    const drainConfig = {
      owner: {
        type: app ? 'app' : 'space',
        id,
      },
      signals: validateAndFormatSignals(signals),
      exporter: {
        endpoint,
        type: this.getExporterType(transport),
        headers: JSON.parse(exporterHeaders),
      },
    }

    const {body: drain} = await this.heroku.post<TelemetryDrain>('/telemetry-drains', {
      body: drainConfig,
      headers: {
        Accept: 'application/vnd.heroku+json; version=3.sdk',
      },
    })

    ux.log(`successfully added drain ${drain.exporter.endpoint}`)
  }

  private getExporterType(transport: string): string {
    switch (transport) {
    case 'grpc':
      return 'otlp'
    case 'splunk':
      return 'splunk'
    default:
      return 'otlphttp'
    }
  }
}
