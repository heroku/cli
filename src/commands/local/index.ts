import * as color from '@heroku/heroku-cli-util/color'
import {Args, Command, Flags} from '@oclif/core'
import fs from 'fs'

import {validateEnvFile} from '../../lib/local/env-file-validator.js'
import {fork as foreman, isForemanExitError} from '../../lib/local/fork-foreman.js'
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
    'start-cmd': Flags.string({
      description: 'command to run as a web process when there’s no Procfile',
    }),
  }

  public hasProcfile(procfilePath: string): boolean {
    return fs.existsSync(procfilePath) && fs.statSync(procfilePath).isFile()
  }

  // Proxy method to make procfile loading testable
  public loadProcfile(procfilePath: string): Record<string, string> {
    return loadProc(procfilePath)
  }

  async run() {
    const {args, flags} = await this.parse(Index)
    const processName = args.processname
    const procfile = flags.procfile || 'Procfile'
    const hasProcfile = this.hasProcfile(procfile)
    const startCmd = flags['start-cmd']
    const useStartCmd = !hasProcfile && !processName && Boolean(startCmd)
    const execArgv = useStartCmd ? ['run'] : ['start']

    if (flags.restart) {
      this.error('--restart is no longer available\nUse forego instead: https://github.com/ddollar/forego')
    }

    if (flags.concurrency) {
      this.error('--concurrency is no longer available\nUse forego instead: https://github.com/ddollar/forego')
    }

    const envFile = validateEnvFile(flags.env, this.warn.bind(this))

    execArgv.push('--env', envFile)

    if (flags.port) {
      if (useStartCmd) {
        this.warn(`Using the --start-cmd flag ignores the specified port, {color.label(flags.port)}.`)
      } else {
        execArgv.push('--port', flags.port)
      }
    }

    if (flags.procfile && hasProcfile) execArgv.push('--procfile', flags.procfile)

    if (processName) {
      execArgv.push(processName)
    } else if (hasProcfile) {
      if (startCmd) {
        this.warn(`Using the --procfile flag ignores the specified start command, ${color.label(startCmd)}.`)
      }

      const procHash = this.loadProcfile(procfile)
      const processes = Object.keys(procHash).filter(x => x !== 'release')
      execArgv.push(processes.join(','))
    } else {
      if (!startCmd) {
        this.error(
          `Your app doesn’t have a ${procfile}.\nAdd a Procfile to add process types. \nSee https://devcenter.heroku.com/articles/procfile.\nOr specify a start command with --start-cmd.`,
        )
      }

      const resolvedStartCmd = startCmd ?? ''
      execArgv.push('--', 'sh', '-c', resolvedStartCmd)
    }

    try {
      await this.runForeman(execArgv)
    } catch (error: unknown) {
      if (isForemanExitError(error)) {
        this.exit(error.exitCode)
      }

      throw error
    }
  }

  // Proxy method to make foreman calls testable
  public async runForeman(execArgv: string[]): Promise<void> {
    return foreman(execArgv)
  }
}
