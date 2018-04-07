import {Hook} from '@oclif/config'
import * as path from 'path'

import deps from '../../deps'

export const tidy: Hook<'update'> = async function () {
  const cleanupPlugins = async () => {
    let pluginsDir = path.join(this.config.dataDir, 'plugins')
    if (await deps.file.exists(path.join(pluginsDir, 'plugins.json'))) return
    let pjson
    try {
      pjson = await deps.file.readJSON(path.join(pluginsDir, 'package.json'))
    } catch (err) {
      if (err.code !== 'ENOENT') throw err
      return
    }
    if (!pjson.dependencies || pjson.dependencies === {}) {
      await deps.file.remove(path.join(pluginsDir))
    }
  }
  await deps.file.removeEmptyDirs(path.join(this.config.dataDir, 'tmp'))
  if (this.config.configDir !== this.config.dataDir) {
    await deps.file.removeEmptyDirs(this.config.configDir)
  }
  if (this.config.cacheDir !== this.config.dataDir) {
    await cleanupPlugins()
  }
}
