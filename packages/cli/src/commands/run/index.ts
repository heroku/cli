import {Command, flags} from '@heroku-cli/command'
import {DynoSizeCompletion, ProcessTypeCompletion} from '@heroku-cli/command/lib/completions.js'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'
import debugFactory from 'debug'

import Dyno from '../../lib/run/dyno.js'
import {buildCommandWithLauncher, revertSortedArgs} from '../../lib/run/helpers.js'

const debug = debugFactory('heroku:run')

export default class Run extends Command {
  static description = 'run a one-off process inside a heroku dyno\nShows a notification if the dyno takes more than 20 seconds to start.\nHeroku automatically prepends \'launcher\' to the command on CNB apps (use --no-launcher to disable).'

  static examples = [
    '$ heroku run bash',
    '$ heroku run -s standard-2x -- myscript.sh -a arg1 -s arg2',
  ]

  static flags = {
    app: flags.app({description: 'parent app used by review apps', required: true}),
    env: flags.string({char: 'e', description: "environment variables to set (use ';' to split multiple vars)"}),
    'exit-code': flags.boolean({char: 'x', description: 'passthrough the exit code of the remote command'}),
    listen: flags.boolean({description: 'listen on a local port', hidden: true}),
    'no-launcher': flags.boolean({
      default: false,
      description: 'don\'t prepend \'launcher\' before a command',
    }),
    'no-notify': flags.boolean({description: 'disables notification when dyno is up (alternatively use HEROKU_NOTIFICATIONS=0)'}),
    'no-tty': flags.boolean({description: 'force the command to not run in a tty'}),
    remote: flags.remote(),
    size: flags.string({char: 's', completion: DynoSizeCompletion, description: 'dyno size'}),
    type: flags.string({completion: ProcessTypeCompletion, description: 'process type'}),
  }

  // This is to allow for variable length arguments
  static strict = false

  async run() {
    const {argv, flags} = await this.parse(Run)
    const command = revertSortedArgs(process.argv, argv as string[])
    const builtCommand = await buildCommandWithLauncher(this.heroku, flags.app, command, flags['no-launcher'])
    const opts = {
      app: flags.app,
      attach: true,
      command: builtCommand,
      env: flags.env,
      'exit-code': flags['exit-code'],
      heroku: this.heroku,
      listen: flags.listen,
      'no-tty': flags['no-tty'],
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
    } catch (error: unknown) {
      debug(error)
      const err = error as {exitCode?: number; message?: string}
      if (err.exitCode) {
        ux.error(err.message || String(error), {exit: err.exitCode})
      } else {
        throw error
      }
    }
  }
}

