import deps from '../../deps'
import { Config } from 'cli-engine-config'
import * as path from 'path'
const debug = require('debug')('heroku:tidy')

export default async function run(config: Config) {
  try {
    await deps.file.cleanup(config.configDir)
    await deps.file.cleanup(path.join(config.dataDir, 'tmp'))
    try {
      await cleanupPlugins(config)
    } catch (err) {
      if (err.code !== 'ENOENT') throw err
    }
  } catch (err) {
    debug(err)
  }
}

async function cleanupPlugins(config: Config) {
  let pluginsDir = path.join(config.dataDir, 'plugins')
  if (await deps.file.exists(path.join(pluginsDir, 'plugins.json'))) return
  let pjson = await deps.file.readJSON(path.join(pluginsDir, 'package.json'))
  if (!pjson.dependencies || pjson.dependencies === {}) {
    await deps.file.remove(path.join(pluginsDir))
  }
}
