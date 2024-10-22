import {Command, flags as Flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import {TelemetryDrain} from '../../lib/types/telemetry'
import heredoc from 'tsheredoc'
import {validateAndFormatSignals} from '../../lib/telemetry/util'
export default class Add extends Command {
  static description = 'Add and configure a new telemetry drain. Defaults to collecting all telemetry unless otherwise specified.'

  static flags = {
    app: Flags.app({exactlyOne: ['app', 'remote', 'space'], description: 'app to add a drain to'}),
    remote: Flags.remote({description: 'git remote of app to add a drain to'}),
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
    $ heroku telemetry:add --signals logs,traces --endpoint https://my-endpoint.com --transport http 'x-drain-example-team: API_KEY x-drain-example-dataset: METRICS_DATASET'
  `)

  private getTypeAndName = function (app: string | undefined, space: string | undefined) {
    if (app) {
      return {type: 'app', name: app}
    }

    return {type: 'space', name: space}
  }

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Add)
    const {app, space, signals, endpoint, transport} = flags
    const {headers} = args
    const typeAndName = this.getTypeAndName(app, space)
    const drainConfig = {
      owner: {
        type: typeAndName.type,
        id: typeAndName.name,
      },
      signals: validateAndFormatSignals(signals),
      exporter: {
        endpoint,
        type: `otlp${transport}`,
        headers: JSON.parse(headers),
      },
    }

    if (app) {
      const {body: drain} = await this.heroku.post<TelemetryDrain>(`/apps/${app}/telemetry-drains`, {
        body: drainConfig,
        headers: {
          Accept: 'application/vnd.heroku+json; version=3.sdk',
        },
      })

      ux.log(`successfully added drain ${drain.exporter.endpoint}`)
    } else if (space) {
      const {body: drain} = await this.heroku.post<TelemetryDrain>(`/spaces/${space}/telemetry-drains`, {
        body: drainConfig,
        headers: {
          Accept: 'application/vnd.heroku+json; version=3.sdk',
        },
      })

      ux.log(`successfully added drain ${drain.exporter.endpoint}`)
    }
  }
}
