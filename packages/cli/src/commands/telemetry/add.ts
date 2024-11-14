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
    space: Flags.string({char: 's', description: 'space to add a drain to'}),
    signals: Flags.string({default: 'all', description: 'comma-delimited list of signals to collect (traces, metrics, logs). Use "all" to collect all signals.'}),
    endpoint: Flags.string({required: true, description: 'drain url'}),
    transport: Flags.string({required: true, options: ['http', 'grpc'], description: 'transport protocol for the drain'}),
  }

  static args = {
    headers: Args.string({required: true, description: 'custom headers to configure the drain in json format'}),
  }

  static example = heredoc(`
    Add a telemetry drain to an app to collect logs and traces:
    $ heroku telemetry:add --app myapp --signals logs,traces --endpoint https://my-endpoint.com --transport http '{"x-drain-example-team": "API_KEY", "x-drain-example-dataset": "METRICS_DATASET"}'
  `)

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Add)
    const {app, space, signals, endpoint, transport} = flags
    const {headers} = args
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

    const drainConfig = {
      owner: {
        type: app ? 'app' : 'space',
        id,
      },
      signals: validateAndFormatSignals(signals),
      exporter: {
        endpoint,
        type: `otlp${transport}`,
        headers: JSON.parse(headers),
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
}
