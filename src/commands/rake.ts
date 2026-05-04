
import {Command, flags} from '@heroku-cli/command'
import {DynoSizeCompletion} from '@heroku-cli/command/lib/completions.js'
import {ux} from '@oclif/core/ux'

import Dyno from '../lib/run/dyno.js'
import {buildCommand} from '../lib/run/helpers.js'

export default class RunRake extends Command {
  static flags = {
    app: flags.app({description: 'parent app used by review apps', required: true}),
    env: flags.string({char: 'e', description: "environment variables to set (use ';' to split multiple vars)"}),
    'exit-code': flags.boolean({char: 'x', description: 'passthrough the exit code of the remote command'}),
    'no-tty': flags.boolean({description: 'force the command to not run in a tty'}),
    remote: flags.remote(),
    size: flags.string({char: 's', completion: DynoSizeCompletion, description: 'dyno size'}),
  }
  static hidden = true
  static strict = false

  async run() {
    const {argv, flags} = await this.parse(RunRake)

    const opts = {
      app: flags.app,
      attach: true,
      command: buildCommand(['rake', ...argv as string[]]),
      env: flags.env,
      'exit-code': flags['exit-code'],
      heroku: this.heroku,
      'no-tty': flags['no-tty'],
      size: flags.size,
    }

    const dyno = new Dyno(opts)
    try {
      await dyno.start()
    } catch (error: any) {
      if (error.exitCode) {
        ux.error(error, {exit: error.exitCode})
      } else {
        throw error
      }
    }
  }
}
