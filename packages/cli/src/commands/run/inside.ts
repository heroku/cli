import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import debugFactory from 'debug'
import Dyno from '../../lib/run/dyno'
import {buildCommand} from '../../lib/run/helpers'
import heredoc from 'tsheredoc'

const debug = debugFactory('heroku:run:inside')

export default class RunInside extends Command {
  static description = 'run a one-off process inside an existing heroku dyno (for Fir-generation apps only)'

  static example = heredoc`
    Run bash
      $ heroku run:inside web-848cd4f64d-pvpr2 bash
    Run a command supplied by a script
      $ heroku run:inside web-848cd4f64d-pvpr2 -- myscript.sh
    Run a command declared for the worker process type in a Procfile
      $ heroku run:inside worker
    `

  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
    'exit-code': flags.boolean({char: 'x', description: 'passthrough the exit code of the remote command'}),
    listen: flags.boolean({description: 'listen on a local port', hidden: true}),
  }

  static args = {
    DYNO_NAME: Args.string({required: true, description: 'name of the dyno to run command inside'}),
    COMMAND: Args.string({required: true, description: 'command to run'}),
  }

  static strict = false

  async run() {
    const {flags, args} = await this.parse(RunInside)

    const opts = {
      'exit-code': flags['exit-code'],
      app: flags.app,
      command: buildCommand([args.COMMAND]),
      dyno: args.DYNO_NAME,
      heroku: this.heroku,
      listen: flags.listen,
    }

    const dyno = new Dyno(opts)

    try {
      await dyno.start()
    } catch (error: any) {
      debug(error)
      if (error.exitCode) {
        ux.exit(error.exitCode)
      } else {
        throw error
      }
    }
  }
}
