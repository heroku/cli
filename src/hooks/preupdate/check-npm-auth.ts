/* eslint-disable valid-jsdoc */
import * as color from '@heroku/heroku-cli-util/color'
import {Hook} from '@oclif/core'
import {ux} from '@oclif/core/ux'
import inquirer from 'inquirer'
import {readFile} from 'node:fs/promises'
import {join} from 'node:path'
import tsheredocLib from 'tsheredoc'

import {NpmAuth} from '../../lib/npm-auth.js'

const tsheredoc = tsheredocLib.default

/**
 * Check if user has private plugins that may require npm authentication
 */
const checkNpmAuth: Hook<'preupdate'> = async function (opts) {
  try {
    // Skip during autoupdate (stdin not available for prompts) or if npm not available
    if (process.argv.includes('--autoupdate')) {
      this.debug('Skipping npm auth check during autoupdate (stdin not available for prompts)')
      return
    }

    if (!await NpmAuth.isNpmAvailable()) {
      this.debug('Skipping npm auth check: npm not available')
      return
    }

    // Read the plugins package.json to see what plugins are installed
    const pluginsPjsonPath = join(this.config.dataDir, 'package.json')
    let pluginsPjson: any

    try {
      const content = await readFile(pluginsPjsonPath, 'utf8')
      pluginsPjson = JSON.parse(content)
    } catch {
      // No plugins installed yet, nothing to check
      return
    }

    const dependencies = pluginsPjson.dependencies || {}
    const plugins = Object.keys(dependencies)

    if (plugins.length === 0) {
      return
    }

    // Check which plugins are actually private
    // Process in batches of 5 to parallelize npm API calls
    const batchSize = 5
    const privatePlugins: string[] = []

    for (let i = 0; i < plugins.length; i += batchSize) {
      const batch = plugins.slice(i, i + batchSize)
      const results = await Promise.all(
        batch.map(async plugin => {
          const isPrivate = await NpmAuth.isPrivatePackage(plugin)
          this.debug(`${plugin} is ${isPrivate ? 'private' : 'public'}`)
          return isPrivate ? plugin : null
        }),
      )

      privatePlugins.push(...results.filter((p): p is string => p !== null))
    }

    if (privatePlugins.length === 0) {
      return
    }

    // Check if npm is authenticated
    const isAuthenticated = await NpmAuth.isAuthenticated()
    if (isAuthenticated) {
      return
    }

    // User is not authenticated, prompt them
    const pluginList = privatePlugins.map(p => `  • ${p}`).join('\n')

    // Stop any running spinner to avoid interfering with the interactive prompt
    ux.action.stop()

    ux.warn(tsheredoc`

      ==================================================================
        NPM AUTHENTICATION REQUIRED
      ==================================================================

      You have ${privatePlugins.length} private plugin(s) installed:
      ${pluginList}

      These plugins require npm authentication to update.

      ==================================================================
    `)

    const {shouldLogin} = await inquirer.prompt([
      {
        default: true,
        message: 'Would you like to authenticate with npm now?',
        name: 'shouldLogin',
        type: 'confirm',
      },
    ])

    if (!shouldLogin) {
      ux.warn(tsheredoc`
        Skipping npm authentication.

        Run ${color.code('npm login')} before your next update to update private plugins.

        Continuing with update, but private plugins may fail to update.
      `)
      return
    }

    // Run npm login
    await NpmAuth.login()
  } catch (error: any) {
    // If user interrupted with Ctrl+C or other exit signal, respect that and exit
    if (error.oclif?.exit !== undefined) {
      throw error
    }

    // For other errors, don't block the update
    this.debug(`npm auth check failed: ${error.message}`)
  }
}

export default checkNpmAuth
