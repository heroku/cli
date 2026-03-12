import execa from 'execa'
import fs from 'fs-extra'
import {fileURLToPath} from 'node:url'
import * as path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const plugins = ['@heroku-cli/plugin-applink']

const skipOnWindows = process.platform === 'win32' ? it.skip : it

function resolvePluginPath(plugin: string): null | string {
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
      it.skip(plugin, async function () {})
      return
    }

    skipOnWindows(plugin, async () => {
      const cwd = path.resolve(__dirname, '../../tmp/plugin', safeCloneDirName(plugin))
      await fs.remove(cwd)
      const pkg = await fs.readJSON(path.join(pluginRoot, 'package.json'))
      const repo = pkg.repository

      if (!repo) {
        throw new Error('No repository found')
      }

      const repoUrl = typeof repo === 'string' ? repo : repo.url

      if (!repoUrl) {
        throw new Error('No repository URL found in package.json')
      }

      let cloneUrl: string

      if (repoUrl.includes('+')) {
        cloneUrl = repoUrl.split('+')[1]
      } else if (repoUrl.startsWith('github:')) {
        cloneUrl = `https://github.com/${repoUrl.slice(7)}.git`
      } else if (repoUrl.startsWith('http://') || repoUrl.startsWith('https://')) {
        cloneUrl = repoUrl
      } else if (/^[^/]+\/[^/]+$/.test(repoUrl)) {
        cloneUrl = `https://github.com/${repoUrl}.git`
      } else {
        cloneUrl = repoUrl
      }

      await execa('git', ['clone', cloneUrl, cwd])
      const opts = {cwd, stdio: [0, 1, 2]}
      await execa('git', ['checkout', `v${pkg.version}`], opts)
      await execa('npm', [], opts)
      await execa('npm', ['test'], opts)
    })
  })
})
