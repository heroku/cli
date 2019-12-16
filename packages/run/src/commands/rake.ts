// tslint:disable:file-name-casing
import {Command, flags} from '@heroku-cli/command'
import {DynoSizeCompletion} from '@heroku-cli/command/lib/completions'
import cli from 'cli-ux'

import Dyno from '../lib/dyno'
import {buildCommand} from '../lib/helpers'

export default class RunRake extends Command {
  static hidden = true

  static strict = false

  static flags = {
    app: flags.app({description: 'parent app used by review apps', required: true}),
    remote: flags.remote(),
    size: flags.string({char: 's', description: 'dyno size', completion: DynoSizeCompletion}),
    'exit-code': flags.boolean({char: 'x', description: 'passthrough the exit code of the remote command'}),
    env: flags.string({char: 'e', description: "environment variables to set (use ';' to split multiple vars)"}),
    'no-tty': flags.boolean({description: 'force the command to not run in a tty'}),
  }

  async run() {
    const {flags, argv} = this.parse(RunRake)

    const opts = {
      heroku: this.heroku,
      app: flags.app,
      command: buildCommand(['rake', ...argv]),
      size: flags.size,
      'exit-code': flags['exit-code'],
      env: flags.env,
      'no-tty': flags['no-tty'],
      attach: true,
    }

    const dyno = new Dyno(opts)
    try {
      await dyno.start()
    } catch (error) {
      if (error.exitCode) {
        cli.error(error)
        // eslint-disable-next-line unicorn/no-process-exit, no-process-exit
        process.exit(error.exitCode)
      } else {
        throw error
      }
    }
  }
}
