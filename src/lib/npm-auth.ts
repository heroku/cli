/* eslint-disable valid-jsdoc */
import {ux} from '@oclif/core/ux'
import {exec, spawn} from 'node:child_process'
import {promisify} from 'node:util'
import tsheredocLib from 'tsheredoc'

const execAsync = promisify(exec)
const tsheredoc = tsheredocLib.default

// eslint-disable-next-line unicorn/no-static-only-class
export class NpmAuth {
  /**
   * Execute a command - extracted for testability
   */
  static async exec(command: string, options?: any): Promise<{stderr: Buffer | string; stdout: Buffer | string;}> {
    return execAsync(command, options)
  }

  /**
   * Check if user is authenticated with npm
   */
  static async isAuthenticated(): Promise<boolean> {
    try {
      await this.exec('npm whoami', {timeout: 5000})
      return true
    } catch {
      return false
    }
  }

  /**
   * Check if npm is available on the system
   */
  static async isNpmAvailable(): Promise<boolean> {
    try {
      await this.exec('npm --version', {timeout: 5000})
      return true
    } catch {
      return false
    }
  }

  /**
   * Check if a package requires authentication by trying to access it
   * Returns true if the package appears to be private (requires auth)
   */
  static async isPrivatePackage(packageName: string): Promise<boolean> {
    try {
      // Try to get package info without authentication
      await this.exec(`npm view ${packageName} name --json`, {
        env: {
          ...process.env,
          // Temporarily unset npm auth to test if package is public
          npm_config_registry: 'https://registry.npmjs.org',
        },
        timeout: 10000,
      })

      // If we successfully got the package info, it's public
      return false
    } catch (error: any) {
      const errorMessage = error.message || error.toString()

      // Auth errors indicate private package
      if (hasAuthError(errorMessage)) {
        return true
      }

      // For any other error (timeout, network, etc.), assume public to avoid false positives
      return false
    }
  }

  /**
   * Run npm login interactively
   * Returns true if login succeeded, false otherwise
   */
  static async login(): Promise<boolean> {
    const loginSucceeded = await new Promise<boolean>(resolve => {
      const npmLogin = this.spawn('npm', ['login'], {
        stdio: 'inherit',
      })

      npmLogin.on('exit', code => {
        resolve(code === 0)
      })

      npmLogin.on('error', () => {
        resolve(false)
      })
    })

    // Verify authentication succeeded
    const authSucceeded = loginSucceeded && await this.isAuthenticated()

    if (authSucceeded) {
      ux.stdout('✓ Successfully authenticated with npm')
    } else {
      ux.warn(tsheredoc`
        npm login did not complete successfully.

        Please authenticate manually before your next update:
          npm login

        Continuing with update, but private plugins may fail to update.
      `)
    }

    return authSucceeded
  }

  /**
   * Spawn a process - extracted for testability
   */
  static spawn(command: string, args: string[], options?: any): ReturnType<typeof spawn> {
    return spawn(command, args, options)
  }
}

/**
 * Check if output contains authentication-related errors
 * Note: npm returns 404 for private packages when not authenticated
 * to avoid leaking information about package existence
 */
function hasAuthError(output: string): boolean {
  return output.includes('401')
    || output.includes('403')
    || output.includes('404')
    || output.includes('E404')
    || output.includes('Unauthorized')
    || output.includes('Forbidden')
    || output.includes('authenticate')
    || output.includes('Access token')
}
