import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {ProcessTypeCompletion} from '@heroku-cli/command/lib/completions'
import logDisplayer from '../lib/run/log-displayer'
import heredoc from 'tsheredoc'

export default class Logs extends Command {
  static description = heredoc`
    display recent log output
    disable colors with --no-color, HEROKU_LOGS_COLOR=0, or HEROKU_COLOR=0
  `

  static examples = [
    'heroku logs --app=my-app',
    'heroku logs --num=50 --app=my-app',
    'heroku logs --dyno=web-123-456 --app=my-app',
    'heroku logs --type=web --app=my-app',
    'heroku logs --app=my-app --tail',
  ]

  static flags = {
    app: flags.app({required: true}),
    dyno: flags.string({
      char: 'd',
      description: 'only show output from this dyno (such as "web-123-456" or "worker.2")',
    }),
    'force-colors': flags.boolean({
      description: 'force use of colors (even on non-tty output)',
    }),
    // supports-color NPM package will parse ARGV looking for flag `--no-color`, but
    // we need to define it here for OClif not to error out on an inexistent flag.
    'no-color': flags.boolean({
      default: false,
      hidden: true,
      relationships: [
        {type: 'none', flags: ['force-colors']},
      ],
    }),
    num: flags.integer({
      char: 'n',
      description: 'number of lines to display (ignored for Fir generation apps)',
    }),
    ps: flags.string({
      char: 'p',
      hidden: true,
      description: 'hidden alias for type',
      relationships: [
        {type: 'none', flags: ['dyno']},
      ],
      completion: ProcessTypeCompletion,
    }),
    remote: flags.remote(),
    source: flags.string({
      char: 's',
      description: 'only show output from this source (such as "app" or "heroku")',
    }),
    tail: flags.boolean({
      char: 't',
      default: false,
      description: 'continually stream logs (defaults to true for Fir generation apps)',
    }),
    type: flags.string({
      description: 'only show output from this process type (such as "web" or "worker")',
      relationships: [
        {type: 'none', flags: ['dyno', 'ps']},
      ],
      completion: ProcessTypeCompletion,
    }),
  }

  async run() {
    const {flags} = await this.parse(Logs)
    const {app, dyno, 'force-colors': forceColors, num, ps, source, tail, type} = flags

    if (forceColors)
      color.enabled = true

    await logDisplayer(this.heroku, {
      app,
      dyno,
      lines: num || 100,
      source,
      tail,
      type: type || ps,
    })
  }
}
