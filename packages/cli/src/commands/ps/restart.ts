import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import color from '@heroku-cli/color'
import {Args, ux} from '@oclif/core'
import {ProcessTypeCompletion} from '@heroku-cli/command/lib/completions'
import heredoc from 'tsheredoc'
export default class Restart extends Command {
  static description = heredoc(`
    restart an app dyno or process type
    if neither --dyno nor --type are specified, restarts all dynos on app
  `)

  static topic = 'ps'
  static aliases = ['dyno:restart']
  static hiddenAliases = ['restart']

  static examples = [
    '$ heroku ps:restart --app myapp --dyno-name web.1',
    '$ heroku ps:restart --app myapp --process-type web',
    '$ heroku ps:restart --app myapp',
  ]

  static args = {
    dyno: Args.string({description: 'name of the dyno to restart', required: false, deprecated: true}),
  }

  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
    'dyno-name': flags.string({
      char: 'd',
      description: 'name of the dyno to restart',
    }),
    'process-type': flags.string({
      char: 'p',
      description: 'name of the process type to restart',
      completion: ProcessTypeCompletion,
      exclusive: ['dyno-name'],
    }),
  }

  async run() {
    const {args, flags} = await this.parse(Restart)
    const app = flags.app
    const dyno = flags['dyno-name'] || args.dyno
    const type = flags['process-type']
    let msg = 'Restarting'
    let restartUrl

    if (type) {
      msg += ` all ${color.cyan(type)} dynos`
      restartUrl = `/apps/${app}/formations/${encodeURIComponent(type)}`
    } else if (dyno) {
      if (args.dyno) {
        ux.warn(`DYNO is a deprecated argument. Use ${color.cmd('--dyno-name')} or ${color.cmd('--process-type')} instead.`)
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
