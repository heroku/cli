import {Hook} from '@anycli/config'
// import * as path from 'path'

// import * as fs from '../../fs'

// const debug = require('debug')('heroku:tidy')

const hook: Hook<'update'> = async _ => {
  // const cleanupPlugins = async () => {
  //   let pluginsDir = path.join(opts.config.dataDir, 'plugins')
  //   if (await fs.pathExists(path.join(pluginsDir, 'plugins.json'))) return
  //   let pjson
  //   try {
  //     pjson = await fs.readJSON(path.join(pluginsDir, 'package.json'))
  //   } catch (err) {
  //     if (err.code !== 'ENOENT') throw err
  //     return
  //   }
  //   if (!pjson.dependencies || pjson.dependencies === {}) {
  //     await fs.remove(path.join(pluginsDir))
  //   }
  // }

  // try {
  //   await fs.removeEmptyDirs(path.join(opts.config.dataDir, 'tmp'))
  //   if (opts.config.configDir !== opts.config.dataDir) {
  //     await fs.removeEmptyDirs(opts.config.configDir)
  //   }
  //   if (opts.config.cacheDir !== opts.config.dataDir) {
  //     await cleanupPlugins()
  //   }
  // } catch (err) {
  //   debug(err)
  // }
}

export default hook
