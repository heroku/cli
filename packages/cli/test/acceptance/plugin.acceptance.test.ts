import execa from 'execa'
import fs from 'fs-extra'
import * as path from 'path'
import {fileURLToPath} from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const plugins = ['@heroku-cli/plugin-ps-exec']

const skipOnWindows = process.platform === 'win32' ? it.skip : it

function resolvePluginPath(plugin: string): string | null {
  const candidates = [
    path.resolve(__dirname, '../../node_modules', plugin, 'package.json'),
    path.resolve(__dirname, '../../../node_modules', plugin, 'package.json'),
  ]
  for (const p of candidates) {
    if (fs.existsSync(p)) return path.dirname(p)
  }

  return null
}

function safeCloneDirName(plugin: string): string {
  return plugin.replace('@heroku-cli/', '')
}

describe('plugins', function () {
  plugins.forEach(plugin => {
    const pluginRoot = resolvePluginPath(plugin)
    if (!pluginRoot) {
      it.skip(plugin, async () => {})
      return
    }

    skipOnWindows(plugin, async () => {
      const cwd = path.resolve(__dirname, '../../tmp/plugin', safeCloneDirName(plugin))
      await fs.remove(cwd)
      const pkg = await fs.readJSON(path.join(pluginRoot, 'package.json'))
      if (!pkg.repository) {
        throw new Error('No repository found')
      }

      await execa('git', ['clone', pkg.repository.url.split('+')[1], cwd])
      const opts = {cwd, stdio: [0, 1, 2]}
      await execa('git', ['checkout', `v${pkg.version}`], opts)
      await execa('yarn', [], opts)
      await execa('yarn', ['test'], opts)
    })
  })
})
