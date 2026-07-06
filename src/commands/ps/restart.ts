
import {Command, flags} from '@heroku-cli/command'
import {ProcessTypeCompletion} from '@heroku-cli/command/lib/completions.js'
import * as color from '@heroku/heroku-cli-util/color'
import {HerokuSDK} from '@heroku/sdk'
import {dynoExtensions} from '@heroku/sdk/extensions/platform'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

const heredoc = tsheredoc.default

export default class Restart extends Command {
  static aliases = ['dyno:restart']
  static args = {
    dyno: Args.string({deprecated: true, description: 'name of the dyno to restart', required: false}),
  }
  static description = heredoc(`
    restart an app dyno or process type
    if neither --dyno nor --type are specified, restarts all dynos on app
  `)
  static examples = [
    `${color.command('heroku ps:restart --app myapp --dyno-name web.1')}`,
    `${color.command('heroku ps:restart --app myapp --process-type web')}`,
    `${color.command('heroku ps:restart --app myapp')}`,
  ]
  static flags = {
    app: flags.app({required: true}),
    'dyno-name': flags.string({
      char: 'd',
      description: 'name of the dyno to restart',
    }),
    'process-type': flags.string({
      char: 'p',
      completion: ProcessTypeCompletion,
      description: 'name of the process type to restart',
      exclusive: ['dyno-name'],
    }),
    remote: flags.remote(),
  }
  static hiddenAliases = ['restart']
  static topic = 'ps'

  async run() {
    const {args, flags} = await this.parse(Restart)
    const {app} = flags
    const dyno = flags['dyno-name'] || args.dyno
    const type = flags['process-type']

    const {platform} = new HerokuSDK({extensions: [dynoExtensions]})

    if (type) {
      ux.action.start(`Restarting all ${color.info(type)} dynos on ${color.app(app)}`)
      await platform.dyno.restart(app, {type})
    } else if (dyno) {
      if (args.dyno) {
        ux.warn(`DYNO is a deprecated argument. Use ${color.code('--dyno-name')} or ${color.code('--process-type')} instead.`)
      }

      ux.action.start(`Restarting dyno ${color.name(dyno)} on ${color.app(app)}`)
      await platform.dyno.restart(app, {dyno})
    } else {
      ux.action.start(`Restarting all dynos on ${color.app(app)}`)
      await platform.dyno.restart(app)
    }

    ux.action.stop()
  }
}
