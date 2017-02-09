const {Command} = require('heroku-cli-command')

class Version extends Command {
  async run () {
    let version = require('../version')
    this.log(`heroku-cli/${version} (${process.platform}-${process.arch}) node-${process.version}`)
  }
}

Version.topic = 'version'
Version.description = 'show CLI version'
Version.aliases = ['-v', 'v', '--version']

module.exports = Version
