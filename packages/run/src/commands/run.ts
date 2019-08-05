import {Command, flags} from '@heroku-cli/command'
import {DynoSizeCompletion, ProcessTypeCompletion} from '@heroku-cli/command/lib/completions'
import cli from 'cli-ux'
import DebugFactory from 'debug'

import Dyno from '../lib/dyno'
import {buildCommand, buildEnvFromFlag} from '../lib/helpers'

const debug = DebugFactory('heroku:run')

export default class Run extends Command {
  static description = 'run a one-off process inside a heroku dyno'

  static examples = [
    '$ heroku run bash',
    '$ heroku run -s hobby -- myscript.sh -a arg1 -s arg2'
  ]

  // This is to allow for variable length arguments
  static strict = false

  static flags = {
    app: flags.app({description: 'parent app used by review apps', required: true}),
    size: flags.string({char: 's', description: 'dyno size', completion: DynoSizeCompletion}),
    type: flags.string({description: 'process type', completion: ProcessTypeCompletion}),
    'exit-code': flags.boolean({char: 'x', description: 'passthrough the exit code of the remote command'}),
    env: flags.string({char: 'e', description: "environment variables to set (use ';' to split multiple vars)"}),
    'no-tty': flags.boolean({description: 'force the command to not run in a tty'}),
    listen: flags.boolean({description: 'listen on a local port', hidden: true}),
    'no-notify': flags.boolean({description: 'disables notification when dyno is up (alternatively use HEROKU_NOTIFICATIONS=0)'})
  }

  async run() {
    const {argv, flags} = this.parse(Run)

    let opts = {
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
      type: flags.type
    }

    if (!opts.command) {
      throw new Error('Usage: heroku run COMMAND\n\nExample: heroku run bash')
    }

    let dyno = new Dyno(opts)
    try {
      await dyno.start()
      debug('done running')
    } catch (err) {
      debug(err)
      if (err.exitCode) {
        cli.exit(err.exitCode)
      } else {
        throw err
      }
    }
  }
}

// module.exports = {
//   topic: 'run',
//   description: 'run a one-off process inside a heroku dyno',
//   help: 'Shows a notification if the dyno takes more than 20 seconds to start.',
//   examples: `$ heroku run bash
// Running bash on app.... up, run.1
// ~ $

// $ heroku run -s hobby -- myscript.sh -a arg1 -s arg2
// Running myscript.sh -a arg1 -s arg2 on app.... up, run.1`,
//   variableArgs: true,
//   needsAuth: true,
//   needsApp: true,
//   flags: [
//     {name: 'size', char: 's', description: 'dyno size', hasValue: true, completion: DynoSizeCompletion},
//     {name: 'type', description: 'process type', hasValue: true, completion: ProcessTypeCompletion},
//     {name: 'exit-code', char: 'x', description: 'passthrough the exit code of the remote command'},
//     {name: 'env', char: 'e', description: "environment variables to set (use ';' to split multiple vars)", hasValue: true},
//     {name: 'no-tty', description: 'force the command to not run in a tty', hasValue: false},
//     {name: 'listen', description: 'listen on a local port', hasValue: false, hidden: true},
//     {name: 'no-notify', description: 'disables notification when dyno is up (alternatively use HEROKU_NOTIFICATIONS=0)', hasValue: false}
//   ],
//   run: cli.command(run)
// }
