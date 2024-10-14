import {Command, flags as Flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import {TelemetryDrains} from '../../lib/types/telemetry'

export default class Add extends Command {
  static description = 'Add and configure a new telemetry drain. Defaults to collecting all telemetry unless otherwise specified.'

  static flags = {
    app: Flags.app({exactlyOne: ['app', 'remote', 'space']}),
    remote: Flags.remote(),
    space: Flags.string({char: 's'}),
    signal: Flags.string({default: 'all'}),
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

  public async run(): Promise<void> {
    const {flags} = await this.parse(Add)
    const {app, space, signal} = flags
    const drainConfig = {
      signals: this.validateAndFormatSignal(signal),
    }

    await this.heroku.put<TelemetryDrains>(`/spaces/${space}/telemetry-drains`, {
      body: drainConfig,
      headers: {
        Accept: 'application/vnd.heroku+json; version=3.fir',
      },
    })
  }
}
