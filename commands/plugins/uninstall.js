const {Command} = require('heroku-cli-command')
const dirs = require('../../lib/dirs')
const path = require('path')

class PluginsUninstall extends Command {
  async run () {
    const plugins = require('../../lib/plugins')
    if (!this.debugging) this.action(`Uninstalling plugin ${this.args.plugin}`)
    await this.yarn('remove', this.args.plugin)
    const d = path.join(dirs.plugins, 'node_modules', this.args.plugin)
    plugins.clearCache(d)
  }

  yarn (...args) {
    const execa = require('execa')
    const cwd = dirs.plugins
    const stdio = this.debugging ? 'inherit' : null
    this.debug(`${cwd}: ${dirs.yarnBin} ${args.join(' ')}`)
    return execa(dirs.yarnBin, args, {cwd, stdio})
  }
}

PluginsUninstall.topic = 'plugins'
PluginsUninstall.command = 'uninstall'
PluginsUninstall.args = [
  {name: 'plugin'}
]

module.exports = PluginsUninstall
