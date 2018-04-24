const {Command, flags} = require('@heroku-cli/command')
const {FileCompletion} = require('@heroku-cli/command/lib/completions')

class Start extends Command {
  async run() {
    const {flags, args} = this.parse(Start)
    if (flags.restart) this.error('--restart is no longer available\nUse forego instead: https://github.com/ddollar/forego')
    if (flags.concurrency) this.error('--concurrency is no longer available\nUse forego instead: https://github.com/ddollar/forego')

    let execArgv = ['start']

    if (flags.procfile) execArgv.push('--procfile', flags.procfile)
    if (flags.env) execArgv.push('--env', flags.env)
    if (flags.port) execArgv.push('--port', flags.port)
    if (args.processname) {
      execArgv.push(args.processname)
    } else {
      let procfile = flags.procfile || 'Procfile'
      let procHash = require('@heroku/foreman/lib/procfile.js').loadProc(procfile)
      let processes = Object.keys(procHash).filter(x => x !== 'release')
      execArgv.push(processes.join(','))
    }
    await require('../../lib/fork_foreman')(execArgv)
  }
}

Start.description = 'run heroku app locally'

Start.examples = [
  '$ heroku local',
  '$ heroku local web',
  '$ heroku local web=2',
  '$ heroku local web=1,worker=2',
]

Start.flags = {
  procfile: flags.string({char: 'f', description: 'use a different Procfile', completion: FileCompletion}),
  env: flags.string({char: 'e', description: 'location of env file (defaults to .env)', completion: FileCompletion}),
  port: flags.string({char: 'p', description: 'port to listen on'}),
  restart: flags.boolean({char: 'r', hidden: true, description: 'restart process if it dies'}),
  concurrency: flags.string({char: 'c', hidden: true, description: 'number of processes to start'}),
}

Start.args = [
  {name: 'processname', required: false},
]

module.exports = Start
