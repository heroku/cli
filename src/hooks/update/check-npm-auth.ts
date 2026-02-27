/* eslint-disable valid-jsdoc */
import {color} from '@heroku/heroku-cli-util'
import {Hook, ux} from '@oclif/core'
import inquirer from 'inquirer'
import {exec, spawn} from 'node:child_process'
import {readFile} from 'node:fs/promises'
import {join} from 'node:path'
import {promisify} from 'node:util'
import tsheredocLib from 'tsheredoc'

const execAsync = promisify(exec)
const tsheredoc = tsheredocLib.default

/**
 * Check if a package requires authentication by trying to access it
 * Returns true if the package appears to be private (requires auth)
 */
async function isPrivatePackage(packageName: string): Promise<boolean> {
  try {
    // Try to get package info without authentication
    const {stderr, stdout} = await execAsync(`npm view ${packageName} name --json`, {
      env: {
        ...process.env,
        // Temporarily unset npm auth to test if package is public
        npm_config_registry: 'https://registry.npmjs.org',
      },
      timeout: 10000,
    })

    const output = stdout + stderr

    // If we get a 401/403 or auth-related error, it's private
    if (
      output.includes('401 Unauthorized')
      || output.includes('403 Forbidden')
      || output.includes('E401')
      || output.includes('E403')
      || output.includes('authenticate')
      || output.includes('Access token')
    ) {
      return true
    }

    // If we get a 404, it might be private or might not exist
    // We'll treat it as potentially private to be safe
    if (output.includes('404') || output.includes('E404')) {
      return true
    }

    // If we successfully got the package name, it's public
    return false
  } catch (error: any) {
    const errorMessage = error.message || error.toString()

    // Auth errors indicate private package
    if (
      errorMessage.includes('401')
      || errorMessage.includes('403')
      || errorMessage.includes('authenticate')
      || errorMessage.includes('Access token')
    ) {
      return true
    }

    // 404 might mean private or non-existent - treat as private to be safe
    if (errorMessage.includes('404')) {
      return true
    }

    // On other errors, assume it might be private
    return true
  }
}

/**
 * Check if user has private plugins that may require npm authentication
 */
const checkNpmAuth: Hook<'preupdate'> = async function (opts) {
  try {
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
    this.debug('Checking if any installed plugins require authentication...')
    const privatePlugins: string[] = []

    for (const plugin of plugins) {
      this.debug(`Checking ${plugin}...`)
      const isPrivate = await isPrivatePackage(plugin)
      if (isPrivate) {
        this.debug(`${plugin} appears to be private`)
        privatePlugins.push(plugin)
      } else {
        this.debug(`${plugin} is public`)
      }
    }

    if (privatePlugins.length === 0) {
      this.debug('No private plugins detected')
      return
    }

    // Check if npm is authenticated
    try {
      await execAsync('npm whoami', {timeout: 5000})
      this.debug('User is authenticated with npm')
    } catch {
      // User is not authenticated, prompt them
      const pluginList = privatePlugins.map(p => `  • ${p}`).join('\n')

      ux.warn(tsheredoc`

        ==================================================================
          NPM AUTHENTICATION REQUIRED
        ==================================================================

        You have ${privatePlugins.length} private plugin(s) installed:
        ${pluginList}

        These plugins require npm authentication to update.

        ==================================================================
      `)

      const {shouldLogin} = await inquirer.prompt([{
        default: true,
        message: 'Would you like to authenticate with npm now?',
        name: 'shouldLogin',
        type: 'confirm',
      }])

      if (!shouldLogin) {
        ux.stdout(tsheredoc`
          Update cancelled. To update the CLI with private plugins, you must
          first authenticate with npm.

          Run ${color.code('npm login')} and then try ${color.code('heroku update')} again. Alternatively,
          you can remove the private plugins and try the update again.
        `)
        ux.exit(1)
      }

      try {
        await new Promise<void>((resolve, reject) => {
          const npmLogin = spawn('npm', ['login'], {
            stdio: 'inherit',
          })

          npmLogin.on('exit', code => {
            if (code === 0) {
              resolve()
            } else {
              reject(new Error(`npm login exited with code ${code}`))
            }
          })

          npmLogin.on('error', reject)
        })

        // Verify authentication succeeded
        try {
          await execAsync('npm whoami', {timeout: 5000})
          ux.stdout('✓ Successfully authenticated with npm')
        } catch {
          this.error(tsheredoc`
            npm login did not complete successfully. Please try again manually:

              npm login

            Then run:
              heroku update
          `, {exit: 1})
        }
      } catch (error: any) {
        ux.action.stop('failed')
        this.error(tsheredoc`
          npm login failed: ${error.message}

          Please authenticate manually:
            npm login

          Then try the update again:
            heroku update
        `, {exit: 1})
      }
    }
  } catch (error: any) {
    // If it's an intentional exit (user chose not to authenticate), let it propagate
    if (error.oclif?.exit !== undefined) {
      throw error
    }

    // For other errors, don't block the update
    this.debug(`npm auth check failed: ${error.message}`)
  }
}

export default checkNpmAuth
