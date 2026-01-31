import {color} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import {ProcessTypeCompletion} from '@heroku-cli/command/lib/completions.js'
import {ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import {LogDisplayer} from '../lib/run/log-displayer.js'

const heredoc = tsheredoc.default

export default class Logs extends Command {
  static description = heredoc`
    display recent log output
    disable colors with --no-color, HEROKU_LOGS_COLOR=0, or HEROKU_COLOR=0
  `

  static examples = [
    `${color.command('heroku logs --app=my-app')}`,
    `${color.command('heroku logs --num=50 --app=my-app')}`,
    `${color.command('heroku logs --dyno-name=web-123-456 --app=my-app')}`,
    `${color.command('heroku logs --process-type=web --app=my-app')}`,
    `${color.command('heroku logs --app=my-app --tail')}`,
  ]

  static flags = {
    app: flags.app({required: true}),
    'dyno-name': flags.string({
      aliases: ['dyno'],
      char: 'd',
      description: 'only show output from this dyno (such as "web-123-456" or "worker.2")',
    }),
    'force-colors': flags.boolean({
      deprecated: true,
    }),
    // supports-color NPM package will parse ARGV looking for flag `--no-color`, but
    // we need to define it here for OClif not to error out on an inexistent flag.
    'no-color': flags.boolean({
      default: false,
      hidden: true,
      relationships: [
        {flags: ['force-colors'], type: 'none'},
      ],
    }),
    num: flags.integer({
      char: 'n',
      description: 'number of lines to display (ignored for Fir generation apps)',
    }),
    'process-type': flags.string({
      char: 'p',
      completion: ProcessTypeCompletion,
      description: 'only show output from this process type (such as "web" or "worker")',
      relationships: [
        {flags: ['dyno-name', 'ps'], type: 'none'},
      ],
    }),
    ps: flags.string({
      char: 'p',
      completion: ProcessTypeCompletion,
      description: 'hidden alias for type',
      hidden: true,
      relationships: [
        {flags: ['dyno-name'], type: 'none'},
      ],
    }),
    remote: flags.remote(),
    source: flags.string({
      char: 's',
      description: 'only show output from this source (such as "app" or "heroku")',
    }),
    tail: flags.boolean({
      char: 't',
      default: false,
      description: 'continually stream logs (always enabled for Fir-generation apps)',
    }),
  }

  async run() {
    const {flags} = await this.parse(Logs)
    const {app, 'dyno-name': dyno, 'force-colors': forceColors, num, 'process-type': type, ps, source, tail} = flags

    if (forceColors)
      ux.warn('The --force-colors flag is deprecated. Use FORCE_COLORS=true to force colors.')

    const options = {
      app,
      dyno,
      lines: num || 100,
      source,
      tail,
      type: type || ps,
    }
    const displayer = new LogDisplayer(this.heroku)
    await displayer.display(options)
  }
}
