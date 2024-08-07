import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import debugFactory from 'debug'
import Dyno from '../../lib/run/dyno'
import {buildCommand} from '../../lib/run/helpers'

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
      command: buildCommand(argv.slice(1) as string[]),
      dyno: argv[0] as string,
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
