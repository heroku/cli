import {Command, flags as Flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import {TelemetryDrain} from '../../lib/types/telemetry'

export default class Add extends Command {
  static description = 'Add and configure a new telemetry drain. Defaults to collecting all telemetry unless otherwise specified.'

  static flags = {
    app: Flags.app({exactlyOne: ['app', 'remote', 'space'], description: 'app to add drain to'}),
    remote: Flags.remote({description: 'git remote of app to add drain to'}),
    space: Flags.string({char: 's', description: 'space to add drain to'}),
    signal: Flags.string({default: 'all', description: 'comma-delimited list of signals to collect (traces, metrics, logs). Use "all" to collect all signals.'}),
    endpoint: Flags.string({required: true, description: 'drain url'}),
    transport: Flags.string({required: true, options: ['http', 'gprc']}),
  }

  static args = {
    headers: Args.string({required: true, description: 'custom headers to configure the drain in json format'}),
  }

  private validateAndFormatSignal = function (signalInput: string | undefined): string[] {
    const signalOptions = ['traces', 'metrics', 'logs']
    if (!signalInput || signalInput === 'all') return signalOptions
    const signalArray = signalInput.split(',')
    signalArray.forEach(signal => {
      if (!signalOptions.includes(signal)) {
        ux.error(`Invalid signal option: ${signal}. Signals must include some combination of "traces", "metrics", or "logs". The option "all" can be used on its own to include all three.`, {exit: 1})
      }
    })
    return signalArray
  }

  private getTypeAndName = function (app: string | undefined, space: string | undefined) {
    if (app) {
      return {type: 'app', name: app}
    }

    return {type: 'space', name: space}
  }

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Add)
    const {app, space, signal, endpoint, transport} = flags
    const {headers} = args
    const typeAndName = this.getTypeAndName(app, space)
    const drainConfig = {
      owner: {
        type: typeAndName.type,
        id: typeAndName.name,
      },
      signals: this.validateAndFormatSignal(signal),
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
