import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import color from '@heroku-cli/color'
import {Args, ux} from '@oclif/core'
import {ProcessTypeCompletion} from '@heroku-cli/command/lib/completions'
import heredoc from 'tsheredoc'

export default class Stop extends Command {
  static description = 'stop app dyno or dyno type'
  static topic = 'ps'
  static aliases = ['dyno:stop', 'ps:kill', 'dyno:kill']
  static hiddenAliases = ['stop', 'kill']

  static examples = [
    '$ heroku ps:stop --app myapp --dyno run.1828',
    '$ heroku ps:stop --app myapp --type run',
  ]

  static args = {
    dyno: Args.string({required: false, deprecated: true}),
  }

  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
    dyno: flags.string({
      char: 'd',
      description: 'stop a specific dyno (such as "web-123-456" or "worker.2")',
    }),
    type: flags.string({
      description: 'stop all dynos of a process type (such as "web" or "worker")',
      completion: ProcessTypeCompletion,
      exclusive: ['dyno'],
    }),
  }

  async run() {
    const {args, flags} = await this.parse(Stop)

    const app = flags.app
    const dyno = flags.dyno || args.dyno
    const type = flags.type
    let msg = 'Stopping'
    let stopUrl = ''

    if (type) {
      msg += ` all ${color.cyan(type)} dynos`
      stopUrl = `/apps/${app}/formations/${encodeURIComponent(type)}/actions/stop`
    } else if (dyno) {
      if (args.dyno) {
        ux.warn(`Passing DYNO as an arg is deprecated. Please use ${color.cmd('heroku ps:stop --dyno')} or ${color.cmd('heroku ps:stop --type')} instead.`)
      }

      msg += ` dyno ${color.cyan(dyno)}`
      stopUrl = `/apps/${app}/dynos/${encodeURIComponent(dyno)}/actions/stop`
    } else {
      ux.error(heredoc(`
        Please specify a process type or dyno to stop.
        See more help with --help
      `))
    }

    msg += ` on ${color.app(app)}`

    ux.action.start(msg)
    await this.heroku.post<Heroku.Dyno>(stopUrl, {headers: {Accept: 'application/vnd.heroku+json; version=3.sdk'}})
    ux.action.stop()
  }
}
