import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import color from '@heroku-cli/color'
import {Args, ux} from '@oclif/core'

export default class Restart extends Command {
  static description = 'restart app dynos'
  static topic = 'ps'
  static aliases = ['restart', 'dyno:restart']

  static examples = [
    '$ heroku ps:restart web.1',
    '$ heroku ps:restart web',
    '$ heroku ps:restart',
  ]

  static help = 'if DYNO is not specified, restarts all dynos on app'

  static args = {
    dyno: Args.string({required: false}),
  }

  static flags = {
    app: flags.app({required: true}),
  }

  async run() {
    const {args, flags} = await this.parse(Restart)

    const app = flags.app
    const dyno = args.dyno

    let msg = 'Restarting'

    if (dyno) msg += ` ${color.cyan(dyno)}`
    msg += (dyno && dyno.includes('.')) ? ' dyno' : ' dynos'
    msg += ` on ${color.app(app)}`

    ux.action.start(msg)
    await this.heroku.delete<Heroku.Dyno>(dyno ? `/apps/${app}/dynos/${encodeURIComponent(dyno)}` : `/apps/${app}/dynos`)
    ux.action.stop()
  }
}
