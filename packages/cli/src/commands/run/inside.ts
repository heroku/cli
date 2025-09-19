import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import debugFactory from 'debug'
import heredoc from 'tsheredoc'
import Dyno from '../../lib/run/dyno'
import {buildCommandWithLauncher} from '../../lib/run/helpers'

const debug = debugFactory('heroku:run:inside')

export default class RunInside extends Command {
  static description = 'run a command inside an existing dyno (for Fir-generation apps only)'

  static strict = false
  static args = {
    dyno_name: Args.string({
      description: 'name of the dyno to run command inside',
      required: true,
    }),
    command: Args.string({
      description: 'command to run (Heroku automatically prepends ‘launcher’ to the command)',
      required: true,
    }),
  }

  static flags = {
    app: flags.app({required: true}),
    'exit-code': flags.boolean({
      char: 'x',
      description: 'passthrough the exit code of the remote command',
    }),
    listen: flags.boolean({description: 'listen on a local port', hidden: true}),
    'no-launcher': flags.boolean({
      description: 'don’t prepend ‘launcher’ before a command',
      default: false,
    }),
    remote: flags.remote(),
  }

  static examples = [
    heredoc`
      Run bash
      heroku run:inside web-848cd4f64d-pvpr2 bash -a my-app
    `,
    heredoc`
      Run a command supplied by a script taking option flags
      heroku run:inside web-848cd4f64d-pvpr2 -a my-app -- myscript.sh -x --log-level=warn
    `,
    heredoc`
      Run a command declared for the worker process type in a Procfile
      heroku run:inside web-848cd4f64d-pvpr2 worker -a my-app
    `,
  ]

  async run() {
    const {args, argv, flags} = await this.parse(RunInside)

    const {dyno_name: dynoName} = args
    const {app: appName, 'exit-code': exitCode, listen, 'no-launcher': noLauncher} = flags

    const opts = {
      app: appName,
      command: await buildCommandWithLauncher(this.heroku, appName, argv.slice(1) as string[], noLauncher),
      dyno: dynoName,
      'exit-code': exitCode,
      heroku: this.heroku,
      listen,
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
