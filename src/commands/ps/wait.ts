import {Command, flags} from '@heroku-cli/command'
import {color} from '@heroku/heroku-cli-util'
import {HerokuSDK} from '@heroku/sdk'
import {dynoExtensions} from '@heroku/sdk/extensions/platform'
import {ux} from '@oclif/core/ux'

export default class Wait extends Command {
  static description = 'wait for all dynos to be running latest version after a release'
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
    type: flags.string({
      char: 't',
      description: 'wait for one specific dyno type',
    }),
    'wait-interval': flags.integer({
      char: 'w',
      default: 10,
      description: 'how frequently to poll in seconds (to avoid hitting Heroku API rate limits)',
      async parse(input) {
        const w = Number.parseInt(input, 10)
        if (w < 10) {
          ux.error('wait-interval must be at least 10', {exit: 1})
        }

        return w
      },
    }),
    'with-run': flags.boolean({
      char: 'R',
      description: 'whether to wait for one-off run dynos',
      exclusive: ['type'],
    }),
  }
  static topic = 'ps'

  async run() {
    const {flags} = await this.parse(Wait)
    const {platform} = new HerokuSDK({extensions: [dynoExtensions]})

    let waiting = false

    const result = await platform.dyno.waitForRelease(flags.app, {
      delayMs: (flags['wait-interval'] as number) * 1000,
      onPoll({onLatest, total, version}) {
        if (!waiting) {
          waiting = true
          ux.action.start(`Waiting for every dyno to be running v${version}`)
        }

        ux.action.status = `${onLatest} / ${total}`
      },
      type: flags.type,
      withRun: flags['with-run'],
    })

    if (result === undefined) {
      this.warn(`App ${color.app(flags.app)} has no releases`)
      return
    }

    if (waiting) {
      ux.action.stop(`${result.total} / ${result.total}, done`)
    }
  }
}
