import {Command, flags} from '@oclif/command';
import  { FileCompletion } from '@heroku-cli/command/lib/completions';
import foreman from '../../fork_foreman';

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
    restart: flags.string({
      char: 'r',
      description: 'restart process if it dies'
    }),
    concurrency: flags.string({
      char: 'c',
      description: 'number of processes to start'
    })
  }
  async run() {
    const execArgv: string[] = ['start']
    const {args, flags} = this.parse(Start)

    if (flags.restart) throw new Error('--restart is no longer available\nUse forego instead: https://github.com/ddollar/forego')
    if (flags.concurrency) throw new Error('--concurrency is no longer available\nUse forego instead: https://github.com/ddollar/forego')

    if (flags.procfile) execArgv.push('--procfile', flags.procfile)
    if (flags.env) execArgv.push('--env', flags.env)
    if (flags.port) execArgv.push('--port', flags.port)
    if (args.processname) {
      execArgv.push(args.processname)
    }
    await foreman(execArgv);
  }
}