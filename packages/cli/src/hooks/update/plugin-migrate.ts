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
  const yarnLockFilePath = path.join(this.config.dataDir, 'yarn.lock')

  const removeYarnLockFile = async () => {
    if (await fs.existsSync(yarnLockFilePath)) {
      const yarnLockFile = await fs.readFileSync(yarnLockFilePath)
      if (yarnLockFile.toString().includes('cli-npm.heroku.com')) {
        await fs.remove(yarnLockFilePath)
      }
    }
  }

  const migrateV6Plugins = async () => {
    if (!await fs.pathExists(pluginsDir)) return
    process.stderr.write('heroku: migrating plugins\n')
    try {
      const p = path.join(pluginsDir, 'user.json')
      if (await fs.pathExists(p)) {
        const {manifest} = await fs.readJSON(p)
        for (let plugin of Object.keys(manifest.plugins)) {
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

  await removeYarnLockFile()
  await migrateV6Plugins()
}
