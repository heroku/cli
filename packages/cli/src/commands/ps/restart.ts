import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import color from '@heroku-cli/color'
import {Args, ux} from '@oclif/core'
import {ProcessTypeCompletion} from '@heroku-cli/command/lib/completions'
import heredoc from 'tsheredoc'
export default class Restart extends Command {
  static description = heredoc(`
    restart app dynos
    if neither --dyno nor --type are specified, restarts all dynos on app
  `)

  static topic = 'ps'
  static aliases = ['dyno:restart']
  static hiddenAliases = ['restart']

  static examples = [
    '$ heroku ps:restart web.1',
    '$ heroku ps:restart web',
    '$ heroku ps:restart',
  ]

  static args = {
    dyno: Args.string({required: false, deprecated: true}),
  }

  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
    dyno: flags.string({
      char: 'd',
      description: 'restart a specific dyno (such as "web-123-456" or "worker.2")',
    }),
    type: flags.string({
      description: 'restart all dynos of a process type (such as "web" or "worker")',
      completion: ProcessTypeCompletion,
      exclusive: ['type'],
    }),
  }

  async run() {
    const {args, flags} = await this.parse(Restart)
    const app = flags.app
    const dyno = flags.dyno || args.dyno
    const type = flags.type
    let msg = 'Restarting'
    let restartUrl

    if (type) {
      msg += ` all ${color.cyan(type)} dynos`
      restartUrl = `/apps/${app}/formations/${encodeURIComponent(type)}`
    } else if (dyno) {
      if (args.dyno) {
        ux.warn(`Passing DYNO as an arg is deprecated. Please use ${color.cmd('heroku ps:restart --dyno')} or ${color.cmd('heroku ps:restart --type')} instead.`)
      }

      msg += ` dyno ${color.cyan(dyno)}`
      restartUrl = `/apps/${app}/dynos/${encodeURIComponent(dyno)}`
    } else {
      msg += ' all dynos'
      restartUrl = `/apps/${app}/dynos`
    }

    msg += ` on ${color.app(app)}`

    ux.action.start(msg)
    await this.heroku.delete<Heroku.Dyno>(restartUrl, {
      headers: {
        Accept: 'application/vnd.heroku+json; version=3.sdk',
      },
    })
    ux.action.stop()
  }
}
