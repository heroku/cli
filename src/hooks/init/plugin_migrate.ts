import {Hook} from '@oclif/config'
import * as fs from 'fs-extra'
import * as path from 'path'

const exec = (cmd: string, args: string[]) => {
  const execa = require('execa')
  return execa(cmd, args, {stdio: 'inherit'})
}

export const migrate: Hook<'init'> = async function () {
  if (process.argv[2] && process.argv[2].startsWith('plugins')) return
  const pluginsDir = path.join(this.config.dataDir, 'plugins')
  if (!await fs.pathExists(pluginsDir)) return
  process.stderr.write('heroku-cli: migrating plugins\n')
  try {
    const {manifest} = await fs.readJSON(path.join(pluginsDir, 'user.json'))
    for (let plugin of Object.keys(manifest.plugins)) {
      process.stderr.write(`heroku-cli: migrating ${plugin}\n`)
      await exec('heroku', ['plugins:install', plugin])
    }
  } catch (err) {
    this.warn(err)
  }
  try {
    const {manifest} = await fs.readJSON(path.join(pluginsDir, 'link.json'))
    for (let {root} of Object.values(manifest.plugins) as any) {
      process.stderr.write(`heroku-cli: migrating ${root}\n`)
      await exec('heroku', ['plugins:link', root])
    }
  } catch (err) {
    this.warn(err)
  }
  await fs.remove(pluginsDir)
  process.stderr.write('heroku-cli: done migrating plugins\n')
}
