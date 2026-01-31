import {color} from '@heroku/heroku-cli-util'
import {Args, Command, Flags} from '@oclif/core'

import {validateEnvFile} from '../../lib/local/env-file-validator.js'
import {fork as foreman} from '../../lib/local/fork-foreman.js'
import {loadProc} from '../../lib/local/load-foreman-procfile.js'

export default class Index extends Command {
  static aliases = ['local:start']

  static args = {
    processname: Args.string({description: 'name of the process', required: false}),
  }

  static description = `run heroku app locally
Start the application specified by a Procfile (defaults to ./Procfile)`

  static examples = [
    color.command('heroku local'),
    color.command('heroku local web'),
    color.command('heroku local web=2'),
    color.command('heroku local web=1,worker=2'),
  ]

  static flags = {
    concurrency: Flags.string({
      char: 'c',
      description: 'number of processes to start',
      hidden: true,
    }),
    env: Flags.string({
      char: 'e',
      description: 'location of env file (defaults to .env)',
    }),
    port: Flags.string({
      char: 'p',
      description: 'port to listen on',
    }),
    procfile: Flags.string({
      char: 'f',
      description: 'use a different Procfile',
    }),
    restart: Flags.boolean({
      char: 'r',
      description: 'restart process if it dies',
      hidden: true,
    }),
  }

  // Proxy method to make procfile loading testable
  public loadProcfile(procfilePath: string): Record<string, string> {
    return loadProc(procfilePath)
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

    const envFile = validateEnvFile(flags.env, this.warn.bind(this))

    if (flags.procfile) execArgv.push('--procfile', flags.procfile)
    execArgv.push('--env', envFile)
    if (flags.port) execArgv.push('--port', flags.port)

    if (args.processname) {
      execArgv.push(args.processname)
    } else {
      const procfile = flags.procfile || 'Procfile'
      const procHash = this.loadProcfile(procfile)
      const processes = Object.keys(procHash).filter(x => x !== 'release')
      execArgv.push(processes.join(','))
    }

    await this.runForeman(execArgv)
  }

  // Proxy method to make foreman calls testable
  public async runForeman(execArgv: string[]): Promise<void> {
    return foreman(execArgv)
  }
}
