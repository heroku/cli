import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import color from '@heroku-cli/color'
import {Args, ux} from '@oclif/core'

export default class Stop extends Command {
  static description = 'stop app dyno'
  static topic = 'ps'
  static aliases = ['dyno:stop', 'ps:kill', 'dyno:kill']
  static hiddenAliases = ['stop', 'kill']

  static examples = [
    '$ heroku ps:stop run.1828',
    '$ heroku ps:stop run',
  ]

  static help = 'stop app dyno or dyno type'

  static args = {
    dyno: Args.string({required: true}),
  }

  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  async run() {
    const {args, flags} = await this.parse(Stop)

    const app = flags.app
    const dyno = args.dyno

    const type = dyno.includes('.') ? 'ps' : 'type'

    ux.action.start(`Stopping ${color.cyan(dyno)} ${type === 'ps' ? 'dyno' : 'dynos'} on ${color.app(app)}`)
    await this.heroku.post<Heroku.Dyno>(`/apps/${app}/dynos/${dyno}/actions/stop`)
    ux.action.stop()
  }
}
