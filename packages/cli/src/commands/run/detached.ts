/* eslint-disable @typescript-eslint/ban-ts-comment */
// tslint:disable:file-name-casing
import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command-v9'
import {DynoSizeCompletion, ProcessTypeCompletion} from '@heroku-cli/command-v9/lib/completions'
import {CliUx} from '@oclif/core-v1'
import '@oclif/core-v1/lib/parser'
import Dyno from '@heroku-cli/plugin-run/lib/lib/dyno'
import {buildCommand} from '@heroku-cli/plugin-run/lib/lib/helpers'
import logDisplayer from '@heroku-cli/plugin-run/lib/lib/log-displayer'

export default class RunDetached extends Command {
  static description = 'run a detached dyno, where output is sent to your logs'

  static examples = [
    '$ heroku run:detached ls',
  ]

  static strict = false

  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
    env: flags.string({char: 'e', description: "environment variables to set (use ';' to split multiple vars)"}),
    size: flags.string({char: 's', description: 'dyno size', completion: DynoSizeCompletion}),
    tail: flags.boolean({char: 't', description: 'continually stream logs'}),
    type: flags.string({description: 'process type', completion: ProcessTypeCompletion}),
  }

  async run() {
    const {flags, argv} = await this.parse(RunDetached)

    const opts = {
      heroku: this.heroku,
      app: flags.app,
      command: buildCommand(argv),
      size: flags.size,
      type: flags.type,
      env: flags.env,
      attach: false,
    }

    if (!opts.command) {
      throw new Error('Usage: heroku run COMMAND\n\nExample: heroku run bash')
    }

    const dyno = new Dyno(opts)

    await dyno.start()

    if (flags.tail) {
      await logDisplayer(this.heroku, {
        app: flags.app,
        // @ts-ignore
        dyno: dyno.dyno.name,
        tail: true,
      })
    } else {
      // @ts-ignore
      CliUx.ux.log(`Run ${color.cmd('heroku logs --app ' + dyno.opts.app + ' --dyno ' + dyno.dyno.name)} to view the output.`)
    }
  }
}
