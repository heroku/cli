'use strict'

const {Command} = require('heroku-command')

class Update extends Command {
  async run () {
    this.log('foo')
  }
}

Update.topic = 'update'

module.exports = Update
