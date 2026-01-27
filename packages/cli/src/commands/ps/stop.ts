import {color} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import {ProcessTypeCompletion} from '@heroku-cli/command/lib/completions.js'
import * as Heroku from '@heroku-cli/schema'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

const heredoc = tsheredoc.default

export default class Stop extends Command {
  static aliases = ['dyno:stop', 'ps:kill', 'dyno:kill']
  static args = {
    dyno: Args.string({deprecated: true, description: 'name of the dyno to stop', required: false}),
  }

  static description = 'stop an app dyno or process type'
  static examples = [
    color.command('heroku ps:stop --app myapp --dyno-name run.1828'),
    color.command('heroku ps:stop --app myapp --process-type run'),
  ]

  static flags = {
    app: flags.app({required: true}),
    'dyno-name': flags.string({
      char: 'd',
      description: 'name of the dyno to stop',
    }),
    'process-type': flags.string({
      char: 'p',
      completion: ProcessTypeCompletion,
      description: 'name of the process type to stop',
      exclusive: ['dyno-name'],
    }),
    remote: flags.remote(),
  }

  static hiddenAliases = ['stop', 'kill']

  static topic = 'ps'

  async run() {
    const {args, flags} = await this.parse(Stop)

    const {app} = flags
    const dyno = flags['dyno-name'] || args.dyno
    const type = flags['process-type']
    let msg = 'Stopping'
    let stopUrl = ''

    if (type) {
      msg += ` all ${color.info(type)} dynos`
      stopUrl = `/apps/${app}/formations/${encodeURIComponent(type)}/actions/stop`
    } else if (dyno) {
      if (args.dyno) {
        ux.warn(`DYNO is a deprecated argument. Use ${color.code('--dyno-name')} or ${color.code('--process-type')} instead.`)
      }

      msg += ` dyno ${color.name(dyno)}`
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
