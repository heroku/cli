import {Hook} from '@oclif/config'
import * as fs from 'fs-extra'
import * as path from 'path'

const exec = (cmd: string, args: string[]) => {
  const execa = require('execa')
  return execa(cmd, args, {stdio: 'inherit'})
}

const deprecated: {[k: string]: string | null} = {
  'heroku-api-plugin': 'api',
  'heroku-cli-autocomplete': 'autocomplete',
  'heroku-sudo': 'sudo',
  'heroku-pipelines': null,
  'heroku-cli-plugin-generator': null,
  '@heroku-cli/config-edit': null,
  'heroku-cli-config-edit': null,
}

export const migrate: Hook<'init'> = async function () {
  if (process.argv[2] && process.argv[2].startsWith('plugins')) return
  const pluginsDir = path.join(this.config.dataDir, 'plugins')

  const migrateV6Plugins = async () => {
    if (!await fs.pathExists(pluginsDir)) return
    process.stderr.write('heroku: migrating plugins\n')
    try {
      const p = path.join(pluginsDir, 'user.json')
      if (await fs.pathExists(p)) {
        const {manifest} = await fs.readJSON(p)
        for (let plugin of Object.keys(manifest.plugins)) {
          if (deprecated[plugin] === null) continue
          plugin = deprecated[plugin] || plugin
          process.stderr.write(`heroku-cli: migrating ${plugin}\n`)
          await exec('heroku', ['plugins:install', plugin])
        }
      }
    } catch (err) {
      this.warn(err)
    }
    try {
      const p = path.join(pluginsDir, 'link.json')
      if (await fs.pathExists(p)) {
        const {manifest} = await fs.readJSON(path.join(pluginsDir, 'link.json'))
        for (let {root} of Object.values(manifest.plugins) as any) {
          process.stderr.write(`heroku-cli: migrating ${root}\n`)
          await exec('heroku', ['plugins:link', root])
        }
      }
    } catch (err) {
      this.warn(err)
    }
    await fs.remove(pluginsDir)
    process.stderr.write('heroku: done migrating plugins\n')
  }

  const migrateDeprecatedPlugins = async () => {
    for (let [name, v] of Object.entries(deprecated)) {
      const plugin = this.config.plugins.find(p => p.name === name)
      if (!plugin) continue
      try {
        if (v) {
            process.stderr.write(`heroku: migrating plugin ${name} to ${v}\n`)
            await exec('heroku', ['plugins:uninstall', name])
            await exec('heroku', ['plugins:install', v])
        } else {
          process.stderr.write(`heroku: removing deprecated plugin ${name}\n`)
          await exec('heroku', ['plugins:uninstall', name])
        }
      } catch (err) {
        this.warn(err)
      }
    }
  }

  await migrateV6Plugins()
  await migrateDeprecatedPlugins()
}
