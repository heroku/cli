// tslint:disable:file-name-casing
import {Command, flags} from '@heroku-cli/command-v9'
import {CliUx} from '@oclif/core-v1'
import '@oclif/core-v1/lib/parser'
import debugFactory from 'debug'
import Dyno from '@heroku-cli/plugin-run/lib/lib/dyno'
import {buildCommand} from '@heroku-cli/plugin-run/lib/lib/helpers'

const debug = debugFactory('heroku:run:inside')

export default class RunInside extends Command {
  static description = 'run a one-off process inside an existing heroku dyno'

  static hidden = true;

  static examples = [
    '$ heroku run:inside web.1 bash',
  ]

  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
    'exit-code': flags.boolean({char: 'x', description: 'passthrough the exit code of the remote command'}),
    listen: flags.boolean({description: 'listen on a local port', hidden: true}),
  }

  static strict = false

  async run() {
    const {flags, argv} = await this.parse(RunInside)

    if (argv.length < 2) {
      throw new Error('Usage: heroku run:inside DYNO COMMAND\n\nExample: heroku run:inside web.1 bash')
    }

    const opts = {
      'exit-code': flags['exit-code'],
      app: flags.app,
      command: buildCommand(argv.slice(1)),
      dyno: argv[0],
      heroku: this.heroku,
      listen: flags.listen,
    }

    const dyno = new Dyno(opts)

    try {
      await dyno.start()
    } catch (error: any) {
      debug(error)
      if (error.exitCode) {
        CliUx.ux.exit(error.exitCode)
      } else {
        throw error
      }
    }
  }
}
