import {FileCompletion} from '@heroku-cli/command/lib/completions'
import {Args, Command, Flags} from '@oclif/core'
import * as fs from 'fs'
import color from '@heroku-cli/color'
import {fork as foreman} from '../../lib/local/fork-foreman'

// eslint-disable-next-line node/no-missing-require
const Procfile: any = require('../../lib/local/load-foreman-procfile')

export default class Index extends Command {
  // \n splits the description between the title shown in the help
  // and the DESCRIPTION section shown in the help
  static description = 'run heroku app locally\nStart the application specified by a Procfile (defaults to ./Procfile)'

  static aliases = ['local:start']

  static args = {
    processname: Args.string({required: false, description: 'The name of the process to run.'}),
  }

  static examples = [
    `$ heroku local
$ heroku local web
$ heroku local web=2
$ heroku local web=1,worker=2`,
  ]

  static flags = {
    procfile: Flags.string({
      char: 'f',
      description: 'use a different Procfile',
      completion: FileCompletion,
    }),
    env: Flags.string({
      char: 'e',
      description: 'location of env file (defaults to .env)',
      completion: FileCompletion,
    }),
    port: Flags.string({
      char: 'p',
      description: 'port to listen on',
    }),
    restart: Flags.boolean({
      char: 'r',
      description: 'restart process if it dies',
      hidden: true,
    }),
    concurrency: Flags.string({
      char: 'c',
      description: 'number of processes to start',
      hidden: true,
    }),
  }

  async run() {
    const execArgv = ['start']
    const {args, flags} = await this.parse(Index)

    if (flags.restart) {
      this.error('--restart is no longer available\nUse forego instead: https://github.com/ddollar/forego')
    }

    if (flags.concurrency) {
      this.error('--concurrency is no longer available\nUse forego instead: https://github.com/ddollar/forego')
    }

    let envFile = flags.env || '.env'
    if (fs.existsSync(envFile) && !fs.statSync(envFile).isFile()) {
      this.warn(`The specified location for the env file, ${color.bold(envFile)}, is not a file, ignoring.`)
      envFile = ''
    }

    if (flags.procfile) execArgv.push('--procfile', flags.procfile)
    execArgv.push('--env', envFile)
    if (flags.port) execArgv.push('--port', flags.port)

    if (args.processname) {
      execArgv.push(args.processname)
    } else {
      const procfile = flags.procfile || 'Procfile'
      const procHash = Procfile.loadProc(procfile)
      const processes = Object.keys(procHash).filter(x => x !== 'release')
      execArgv.push(processes.join(','))
    }

    await foreman(execArgv)
  }
}
