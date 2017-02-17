const {Command} = require('heroku-cli-command')
const util = require('../../lib/util')

class Plugins extends Command {
  async run () {
    let plugins = require('../../lib/plugins')
    plugins = plugins.list()
    plugins = Object.keys(plugins).map(p => plugins[p])
    plugins = plugins.filter(p => p.type !== 'builtin')
    plugins.sort(util.compare('name'))
    if (!this.flags.core) plugins = plugins.filter(p => p.type !== 'core')
    if (!plugins.length) this.warn('no plugins installed')
    for (let plugin of plugins) {
      let output = `${plugin.name} ${plugin.version}`
      if (plugin.type !== 'user') output += ` (${plugin.type})`
      this.log(output)
    }
  }
}

Plugins.topic = 'plugins'
Plugins.flags = [
  {name: 'core', description: 'show core plugins'}
]

module.exports = Plugins
