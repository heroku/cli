const {Command} = require('@heroku-cli/command')

class Version extends Command {
  async run() {
    let execArgv = ['--version']
    await require('../../lib/fork_foreman')(execArgv)
  }
}

Version.description = 'display node-foreman version'

Version.examples = [
  `$ heroku local:version
2.0.2
`,
]

module.exports = Version
