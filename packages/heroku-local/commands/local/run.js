const {Command, flags} = require('@heroku-cli/command')
const {FileCompletion} = require('@heroku-cli/command/lib/completions')

class Run extends Command {
  async run() {
    const {flags, argv} = this.parse(Run)
    if (argv.length === 0) {
      this.error('Usage: heroku local:run [COMMAND]\nMust specify command to run')
    }

    let execArgv = ['run']

    if (flags.env) execArgv.push('--env', flags.env)
    if (flags.port) execArgv.push('--port', flags.port)

    execArgv.push('--') // disable node-foreman flag parsing
    execArgv.push(...argv)

    await require('../../lib/fork_foreman')(execArgv)
  }
}

Run.description = 'run a one-off command'

Run.examples = [
  '$ heroku local:run bin/migrate',
]

Run.flags = {
  env: flags.string({char: 'e', completion: FileCompletion}),
  port: flags.string({char: 'p'}),
}

Run.strict = false

module.exports = Run
