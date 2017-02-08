'use strict'

const {Command} = require('heroku-cli-command')

class Update extends Command {
  async run () {
    this.log('foo')
  }
}

Update.topic = 'update'

module.exports = Update
