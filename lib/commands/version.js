'use strict'

const {Command} = require('heroku-command')

class Version extends Command {
  async run () {
    let version = require('../version')
    this.log(version)
  }
}

Version.topic = 'version'
Version.aliases = ['-v', 'v', '--version']

module.exports = Version
