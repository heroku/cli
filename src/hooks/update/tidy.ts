import {Hook} from '@oclif/core'
import * as path from 'path'
import * as fs from 'fs-extra'

async function removeEmptyDirs(dir: string): Promise<void> {
  let files
  try {
    const filenames = await fs.readdir(dir)
    const paths = filenames.map(f => path.join(dir, f))
    files = await Promise.all(paths.map(async p => ({path: p, stat: await fs.stat(p)})))
  } catch (error: any) {
    if (error.code === 'ENOENT') return
    throw error
  }

  const dirs = files.filter(f => f.stat.isDirectory()).map(f => f.path)
  for (const p of dirs.map(removeEmptyDirs)) await p
  files = await fs.readdir(dir).then(async filenames => {
    const paths = filenames.map(f => path.join(dir, f))
    return Promise.all(paths.map(async p => ({path: p, stat: await fs.stat(p)})))
  })
  if (files.length === 0) await fs.remove(dir)
}

const tidy: Hook<'update'> = async function () {
  const cleanupPlugins = async () => {
    const pluginsDir = path.join(this.config.dataDir, 'plugins')
    if (await fs.pathExists(path.join(pluginsDir, 'plugins.json'))) return
    let pjson
    try {
      pjson = await fs.readJSON(path.join(pluginsDir, 'package.json'))
    } catch (error: any) {
      if (error.code !== 'ENOENT') throw error
      return
    }

    if (!pjson.dependencies || Object.keys(pjson.dependencies).length === 0) {
      await fs.remove(path.join(pluginsDir))
    }
  }

  await removeEmptyDirs(path.join(this.config.dataDir, 'tmp'))
  if (this.config.configDir !== this.config.dataDir) {
    await removeEmptyDirs(this.config.configDir)
  }

  if (this.config.cacheDir !== this.config.dataDir) {
    await cleanupPlugins()
  }
}

export default tidy
