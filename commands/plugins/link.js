const {Command} = require('heroku-cli-command')
const path = require('path')

class PluginsLink extends Command {
  async run () {
    const plugins = require('../../lib/plugins')
    const m = path.resolve(this.args.path || process.cwd())
    this.action(`Linking plugin from ${m}`)
    if (!require(m).commands) throw new Error('this does not appear to be a Heroku plugin')
    plugins.addLinkedPlugin(m)
  }
}

PluginsLink.topic = 'plugins'
PluginsLink.command = 'link'
PluginsLink.args = [
  {name: 'path', optional: true}
]

module.exports = PluginsLink
