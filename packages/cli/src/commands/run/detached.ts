import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {DynoSizeCompletion, ProcessTypeCompletion} from '@heroku-cli/command/lib/completions'
import {ux} from '@oclif/core'
import Dyno from '../../lib/run/dyno'
import {buildCommand} from '../../lib/run/helpers'
import logDisplayer from '../../lib/run/log-displayer'

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
      command: buildCommand(argv as string[]),
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
        dyno: dyno.dyno?.name,
        tail: true,
      })
    } else {
      ux.log(`Run ${color.cmd(`heroku logs --app ${dyno.opts.app} --dyno ${dyno.dyno?.name || ''}`)} to view the output.`)
    }
  }
}
