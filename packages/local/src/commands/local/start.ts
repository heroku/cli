import {Command, flags} from '@oclif/command';
import { FileCompletion } from '@heroku-cli/command/lib/completions';
import foreman from '../../fork_foreman';
// import procLoader from 'foreman/lib/procfile.js';
const procLoader = require('foreman/lib/procfile.js')

export default class Start extends Command {
  static description = 'run heroku app locally'
  static examples = [
    `$ heroku local
    $ heroku local web
    $ heroku local web=2
    $ heroku local web=1,worker=2`
  ]
  static strict = false
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
    const {args, flags} = this.parse(Start)

    if (flags.restart){
      this.error('--restart is no longer available\nUse forego instead: https://github.com/ddollar/forego')
    }
    if (flags.concurrency){
      this.error('--concurrency is no longer available\nUse forego instead: https://github.com/ddollar/forego')
    }

    if (flags.procfile) execArgv.push('--procfile', flags.procfile)
    if (flags.env) execArgv.push('--env', flags.env)
    if (flags.port) execArgv.push('--port', flags.port)
    if (args.processname) {
      execArgv.push(args.processname)
    } else {
      let procfile = flags.procfile || 'Procfile'
      let procHash = procLoader.loadProc(procfile)
      let processes = Object.keys(procHash).filter((x) => x !== 'release')
      execArgv.push(processes.join(','))
    }
    await foreman(execArgv)
  }
}