// tslint:disable:file-name-casing
import {Command, flags} from '@heroku-cli/command'
import cli from 'cli-ux'
import debugFactory from 'debug'

import Dyno from '../../lib/dyno'
import {buildCommand} from '../../lib/helpers'

const debug = debugFactory('heroku:run:inside')

export default class RunInside extends Command {
  static description = 'run a one-off process inside an existing heroku dyno'

  static examples = [
    '$ heroku run:inside web.1 bash',
  ]

  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
    'exit-code': flags.boolean({char: 'x', description: 'passthrough the exit code of the remote command'}),
    env: flags.string({char: 'e', description: "environment variables to set (use ';' to split multiple vars)"}),
    listen: flags.boolean({description: 'listen on a local port', hidden: true}),
  }

  static strict = false

  async run() {
    const {flags, argv} = this.parse(RunInside)

    if (argv.length < 2) {
      throw new Error('Usage: heroku run:inside DYNO COMMAND\n\nExample: heroku run:inside web.1 bash')
    }

    const opts = {
      'exit-code': flags['exit-code'],
      app: flags.app,
      command: buildCommand(argv.slice(1)),
      dyno: argv[0],
      env: flags.env,
      heroku: this.heroku,
      listen: flags.listen,
    }

    const dyno = new Dyno(opts)

    try {
      await dyno.start()
    } catch (error) {
      debug(error)
      if (error.exitCode) {
        cli.exit(error.exitCode)
      } else {
        throw error
      }
    }
  }
}
