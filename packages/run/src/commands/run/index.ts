import {Command, flags} from '@heroku-cli/command'
import {DynoSizeCompletion, ProcessTypeCompletion} from '@heroku-cli/command/lib/completions'
import cli from 'cli-ux'
import debugFactory from 'debug'
import * as Heroku from '@heroku-cli/schema'

import Dyno from '../../lib/dyno'
import {buildCommand} from '../../lib/helpers'

const debug = debugFactory('heroku:run')

export default class Run extends Command {
  static description = 'run a one-off process inside a heroku dyno\nShows a notification if the dyno takes more than 20 seconds to start.'

  static examples = [
    '$ heroku run bash',
    '$ heroku run -s hobby -- myscript.sh -a arg1 -s arg2',
  ]

  // This is to allow for variable length arguments
  static strict = false

  static flags = {
    app: flags.app({description: 'parent app used by review apps', required: true}),
    remote: flags.remote(),
    size: flags.string({char: 's', description: 'dyno size', completion: DynoSizeCompletion}),
    type: flags.string({description: 'process type', completion: ProcessTypeCompletion}),
    'exit-code': flags.boolean({char: 'x', description: 'passthrough the exit code of the remote command'}),
    env: flags.string({char: 'e', description: "environment variables to set (use ';' to split multiple vars)"}),
    'no-tty': flags.boolean({description: 'force the command to not run in a tty'}),
    listen: flags.boolean({description: 'listen on a local port', hidden: true}),
    'no-notify': flags.boolean({description: 'disables notification when dyno is up (alternatively use HEROKU_NOTIFICATIONS=0)'}),
  }

  async run() {
    const {argv, flags} = this.parse(Run)

    const opts = {
      'exit-code': flags['exit-code'],
      'no-tty': flags['no-tty'],
      app: flags.app,
      attach: true,
      command: buildCommand(argv),
      env: flags.env,
      heroku: this.heroku,
      listen: flags.listen,
      notify: !flags['no-notify'],
      size: flags.size,
      type: flags.type,
    }

    if (!opts.command) {
      throw new Error('Usage: heroku run COMMAND\n\nExample: heroku run bash')
    }
    await this.heroku.get<Heroku.Account>('/account')
    const dyno = new Dyno(opts)
    try {
      await dyno.start()
      debug('done running')
    } catch (error) {
      debug(error)
      if (error.exitCode) {
        cli.error(error.message, {code: error.exitCode, exit: error.exitCode})
      } else {
        throw error
      }
    }
  }
}
