const {Command, mixins} = require('heroku-cli-command')
const yarn = require('../../mixins/yarn')
const dirs = require('../../lib/dirs')
const fs = require('fs-extra')

class PluginsUninstall extends mixins.mix(Command).with(yarn) {
  async run () {
    if (!this.debugging) this.action(`Uninstalling plugin ${this.args.plugin}`)
    if (fs.existsSync(dirs.userPlugin(this.args.plugin))) {
      await this.yarn('remove', this.args.plugin)
    } else {
      this.plugins.removeLinkedPlugin(this.args.plugin)
    }
    this.plugins.clearCache(dirs.userPlugin(this.args.plugin))
  }

  get plugins () { return require('../../lib/plugins') }
}

PluginsUninstall.topic = 'plugins'
PluginsUninstall.command = 'uninstall'
PluginsUninstall.args = [
  {name: 'plugin'}
]
PluginsUninstall.aliases = ['unlink']

module.exports = PluginsUninstall
