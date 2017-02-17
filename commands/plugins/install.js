const {Command} = require('heroku-cli-command')
const dirs = require('../../lib/dirs')
const fs = require('fs-extra')
const path = require('path')

class PluginsInstall extends Command {
  async run () {
    const plugins = require('../../lib/plugins')
    if (!this.debugging) this.action(`Installing plugin ${this.args.plugin}`)
    await this.setupYarn()
    await this.yarn('add', this.args.plugin)
    try {
      let d = path.join(dirs.plugins, 'node_modules', this.args.plugin)
      let plugin = require(d)
      if (!plugin.commands) throw new Error(`${this.args.plugin} does not appear to be a Heroku CLI plugin`)
      plugins.clearCache(d)
    } catch (err) {
      if (!this.debugging) this.action(`ERROR: uninstalling ${this.args.plugin}`)
      this.warn('Run with --debug to see extra information')
      await this.yarn('remove', this.args.plugin)
      throw err
    }
  }

  async setupYarn () {
    const pjson = path.join(dirs.plugins, 'package.json')
    fs.mkdirpSync(dirs.plugins)
    if (!fs.existsSync(pjson)) fs.writeFileSync(pjson, JSON.stringify({private: true}))
    await this.yarn()
  }

  yarn (...args) {
    const execa = require('execa')
    const cwd = dirs.plugins
    const stdio = this.debugging ? 'inherit' : null
    this.debug(`${cwd}: ${dirs.yarnBin} ${args.join(' ')}`)
    return execa(dirs.yarnBin, args, {cwd, stdio})
  }
}

PluginsInstall.topic = 'plugins'
PluginsInstall.command = 'install'
PluginsInstall.args = [
  {name: 'plugin'}
]

module.exports = PluginsInstall
