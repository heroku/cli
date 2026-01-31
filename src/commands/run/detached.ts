import {color} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import {DynoSizeCompletion, ProcessTypeCompletion} from '@heroku-cli/command/lib/completions.js'
import {ux} from '@oclif/core'

import Dyno from '../../lib/run/dyno.js'
import {buildCommandWithLauncher} from '../../lib/run/helpers.js'
import {LogDisplayer} from '../../lib/run/log-displayer.js'

export default class RunDetached extends Command {
  static description = 'run a detached dyno, where output is sent to your logs'

  static examples = [
    color.command('heroku run:detached ls'),
  ]

  static flags = {
    app: flags.app({required: true}),
    env: flags.string({char: 'e', description: "environment variables to set (use ';' to split multiple vars)"}),
    'no-launcher': flags.boolean({
      default: false,
      description: 'don\'t prepend \'launcher\' before a command',
    }),
    remote: flags.remote(),
    size: flags.string({char: 's', completion: DynoSizeCompletion, description: 'dyno size'}),
    tail: flags.boolean({char: 't', description: 'continually stream logs'}),
    type: flags.string({completion: ProcessTypeCompletion, description: 'process type'}),
  }

  static strict = false

  async run() {
    const {argv, flags} = await this.parse(RunDetached)

    const opts = {
      app: flags.app,
      attach: false,
      command: await buildCommandWithLauncher(this.heroku, flags.app, argv as string[], flags['no-launcher']),
      env: flags.env,
      heroku: this.heroku,
      size: flags.size,
      type: flags.type,
    }

    if (!opts.command) {
      throw new Error('Usage: heroku run COMMAND\n\nExample: heroku run bash')
    }

    const dyno = new Dyno(opts)

    await dyno.start()

    if (flags.tail) {
      const displayer = new LogDisplayer(this.heroku)
      await displayer.display({
        app: flags.app,
        dyno: dyno.dyno?.name,
        tail: true,
      })
    } else {
      ux.stdout(`Run ${color.code(`heroku logs --app ${dyno.opts.app} --dyno ${dyno.dyno?.name || ''}`)} to view the output.\n`)
    }
  }
}

