const {Command} = require('heroku-cli-command')

class Version extends Command {
  async run () {
    let version = require('../lib/version')
    if (process.env.HEROKU_DEV) this.log(`HEROKU_DEV=${process.env.HEROKU_DEV}`)
    this.log(`heroku-cli/${version} (${process.platform}-${process.arch}) node-${process.version}`)
  }
}

Version.topic = 'version'
Version.description = 'show CLI version'
Version.aliases = ['-v', 'v', '--version']

module.exports = Version
