const {Command} = require('heroku-cli-command')

class PluginsInstall extends Command {
  async run () {
    const execa = require('execa')
    await execa('yarn')
  }
}

PluginsInstall.topic = 'plugins'
PluginsInstall.command = 'install'
PluginsInstall.args = [
  {name: 'plugin'}
]

module.exports = PluginsInstall
