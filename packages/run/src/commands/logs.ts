// tslint:disable:file-name-casing
import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {ProcessTypeCompletion} from '@heroku-cli/command/lib/completions'

import logDisplayer from '../lib/log-displayer'

export default class Logs extends Command {
  static description = `display recent log output
disable colors with --no-color, HEROKU_LOGS_COLOR=0, or HEROKU_COLOR=0`

  static examples = [
    '$ heroku logs --app=my-app',
    '$ heroku logs --num=50',
    '$ heroku logs --dyno=web --app=my-app',
    '$ heroku logs --app=my-app --tail',
  ]

  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
    num: flags.integer({char: 'n', description: 'number of lines to display'}),
    ps: flags.string({char: 'p', description: 'hidden alias for dyno', hidden: true}),
    dyno: flags.string({
      char: 'd',
      description: 'only show output from this dyno type (such as "web" or "worker")',
      completion: ProcessTypeCompletion,
    }),
    source: flags.string({char: 's', description: 'only show output from this source (such as "app" or "heroku")'}),
    tail: flags.boolean({char: 't', description: 'continually stream logs'}),
    'force-colors': flags.boolean({description: 'force use of colors (even on non-tty output)'}),
  }

  async run() {
    const {flags} = await this.parse(Logs)

    color.enabled = flags['force-colors'] || color.enabled

    await logDisplayer(this.heroku, {
      app: flags.app,
      dyno: flags.dyno || flags.ps,
      lines: flags.num || 100,
      tail: flags.tail,
      source: flags.source,
    })
  }
}
