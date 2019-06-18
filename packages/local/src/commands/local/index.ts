import {FileCompletion} from '@heroku-cli/command/lib/completions'
import {Command, flags} from '@oclif/command'
import {loadProc} from 'foreman/lib/procfile'

import {fork as foreman} from '../../fork-foreman'

export default class Index extends Command {
  // \n splits the description between the title shown in the help
  // and the DESCRIPTION section shown in the help
  static description = 'run heroku app locally\nStart the application specified by a Procfile (defaults to ./Procfile)'
  static aliases = ['local:start']
  static args = [{name: 'processname', required: false}]

  static examples = [
    `$ heroku local
$ heroku local web
$ heroku local web=2
$ heroku local web=1,worker=2`
  ]

  static flags = {
    procfile: flags.string({
      char: 'f',
      description: 'use a different Procfile',
      completion: FileCompletion
    }),
    env: flags.string({
      char: 'e',
      description: 'location of env file (defaults to .env)',
      completion: FileCompletion
    }),
    port: flags.string({
      char: 'p',
      description: 'port to listen on'
    }),
    restart: flags.boolean({
      char: 'r',
      description: 'restart process if it dies',
      hidden: true
    }),
    concurrency: flags.string({
      char: 'c',
      description: 'number of processes to start',
      hidden: true
    })
  }

  async run() {
    const execArgv = ['start']
    const {args, flags} = this.parse(Index)

    if (flags.restart) {
      this.error('--restart is no longer available\nUse forego instead: https://github.com/ddollar/forego')
    }

    if (flags.concurrency) {
      this.error('--concurrency is no longer available\nUse forego instead: https://github.com/ddollar/forego')
    }

    if (flags.procfile) execArgv.push('--procfile', flags.procfile)
    if (flags.env) execArgv.push('--env', flags.env)
    if (flags.port) execArgv.push('--port', flags.port)

    if (args.processname) {
      execArgv.push(args.processname)
    } else {
      let procfile = flags.procfile || 'Procfile'
      let procHash = loadProc(procfile)
      let processes = Object.keys(procHash).filter(x => x !== 'release')
      execArgv.push(processes.join(','))
    }

    await foreman(execArgv)
  }
}
