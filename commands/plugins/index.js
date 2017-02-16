const {Command} = require('heroku-cli-command')

class Plugins extends Command {
  async run () {
    const plugins = require('../../lib/plugins')
    console.dir(plugins.list())
  }
}

Plugins.topic = 'plugins'
Plugins.flags = [
  {name: 'core', description: 'show core plugins'}
]

module.exports = Plugins
