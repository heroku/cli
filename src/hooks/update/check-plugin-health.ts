import {color} from '@heroku/heroku-cli-util'
import {Hook} from '@oclif/core'
import {existsSync} from 'node:fs'
import {readFile} from 'node:fs/promises'
import {join} from 'node:path'
import tsheredocLib from 'tsheredoc'

const tsheredoc = tsheredocLib.default

// eslint-disable-next-line valid-jsdoc
/**
 * Check if plugins are properly installed after an update
 * and provide recovery instructions if they're not
 */
const checkPluginHealth: Hook<'update'> = async function (opts) {
  try {
    // Read the plugins package.json to see what plugins should be installed
    const pluginsPjsonPath = join(this.config.dataDir, 'package.json')

    if (!existsSync(pluginsPjsonPath)) {
      // No plugins configured, nothing to check
      return
    }

    let pluginsPjson: any
    try {
      const content = await readFile(pluginsPjsonPath, 'utf8')
      pluginsPjson = JSON.parse(content)
    } catch {
      return
    }

    const configuredPlugins = Object.keys(pluginsPjson.dependencies || {})
    if (configuredPlugins.length === 0) {
      return
    }

    // Check if any configured plugins are missing from node_modules
    const nodeModulesPath = join(this.config.dataDir, 'node_modules')
    const missingPlugins: string[] = []

    for (const plugin of configuredPlugins) {
      const pluginPath = join(nodeModulesPath, plugin)
      if (!existsSync(pluginPath)) {
        missingPlugins.push(plugin)
      }
    }

    if (missingPlugins.length > 0) {
      const pluginList = missingPlugins.map(p => `  • ${p}`).join('\n')
      const installCommands = missingPlugins.map(p => `   ${color.code('heroku plugins:install')} ${p}`).join('\n')
      const uninstallCommands = missingPlugins.map(p => `   ${color.code('heroku plugins:uninstall')} ${p}`).join('\n')

      this.warn(tsheredoc`

        ===================================================================
          PLUGIN INSTALLATION INCOMPLETE
        ===================================================================

        ${missingPlugins.length} plugin(s) failed to install during the update:
        ${pluginList}

        This usually happens when:
          • Network issues during installation
          • The plugin has been removed from the npm registry
          • A version conflict or dependency issue
          • Insufficient disk space

        To fix this:

        1. Manually reinstall each plugin:
        ${installCommands}

        2. Or remove plugins you no longer need:
        ${uninstallCommands}

        ${'═'.repeat(70)}

      `)
    }
  } catch (error: any) {
    // Don't block if this check fails
    this.debug(`plugin health check failed: ${error.message}`)
  }
}

export default checkPluginHealth
