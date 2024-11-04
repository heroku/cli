import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import color from '@heroku-cli/color'
import {Args, ux} from '@oclif/core'
import {ProcessTypeCompletion} from '@heroku-cli/command/lib/completions'
import heredoc from 'tsheredoc'

export default class Stop extends Command {
  static description = 'stop an app dyno or process type'
  static topic = 'ps'
  static aliases = ['dyno:stop', 'ps:kill', 'dyno:kill']
  static hiddenAliases = ['stop', 'kill']

  static examples = [
    '$ heroku ps:stop --app myapp --dyno-name run.1828',
    '$ heroku ps:stop --app myapp --process-type run',
  ]

  static args = {
    dyno: Args.string({description: 'name of the dyno to stop', required: false, deprecated: true}),
  }

  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
    'dyno-name': flags.string({
      char: 'd',
      description: 'name of the dyno to stop',
    }),
    'process-type': flags.string({
      char: 'p',
      description: 'name of the process type to stop',
      completion: ProcessTypeCompletion,
      exclusive: ['dyno-name'],
    }),
  }

  async run() {
    const {args, flags} = await this.parse(Stop)

    const app = flags.app
    const dyno = flags['dyno-name'] || args.dyno
    const type = flags['process-type']
    let msg = 'Stopping'
    let stopUrl = ''

    if (type) {
      msg += ` all ${color.cyan(type)} dynos`
      stopUrl = `/apps/${app}/formations/${encodeURIComponent(type)}/actions/stop`
    } else if (dyno) {
      if (args.dyno) {
        ux.warn(`DYNO is a deprecated argument. Use ${color.cmd('--dyno-name')} or ${color.cmd('--process-type')} instead.`)
      }

      msg += ` dyno ${color.cyan(dyno)}`
      stopUrl = `/apps/${app}/dynos/${encodeURIComponent(dyno)}/actions/stop`
    } else {
      ux.error(heredoc(`
        Please specify a process type or dyno name to stop.
        See more help with --help
      `))
    }

    msg += ` on ${color.app(app)}`

    ux.action.start(msg)
    await this.heroku.post<Heroku.Dyno>(stopUrl, {headers: {Accept: 'application/vnd.heroku+json; version=3.sdk'}})
    ux.action.stop()
  }
}
