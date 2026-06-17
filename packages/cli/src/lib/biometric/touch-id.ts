import {promisify} from 'node:util'
import {execFile as execFileCallback} from 'node:child_process'
import {platform} from 'node:os'

const execFile = promisify(execFileCallback)

// cSpell:words bioutil osascript

/**
 * Touch ID authentication module for macOS
 * Uses biometric authentication before allowing non-GET HTTP requests
 */

export interface BiometricAuthResult {
  authenticated: boolean
  error?: string
  skipped?: boolean
}

/**
 * Check if Touch ID is available on this platform
 */
export async function isTouchIdAvailable(): Promise<boolean> {
  // Only available on macOS
  if (platform() !== 'darwin') {
    return false
  }

  try {
    // Check if biometric authentication is available using bioutil
    const {stdout} = await execFile('bioutil', ['-r'])
    return stdout.includes('Touch ID') || stdout.includes('Biometry')
  } catch {
    return false
  }
}

/**
 * Prompt for Touch ID authentication using Swift script
 * @param reason - The reason for requesting authentication
 */
export async function authenticateWithTouchId(reason = 'Heroku CLI requires authentication for this operation'): Promise<BiometricAuthResult> {
  if (platform() !== 'darwin') {
    return {authenticated: true, skipped: true}
  }

  const available = await isTouchIdAvailable()
  if (!available) {
    return {authenticated: true, skipped: true}
  }

  try {
    // Use Swift script for proper Touch ID authentication
    const scriptPath = require('node:path').join(__dirname, '../../../scripts/touch-id-auth.swift')
    const {stdout} = await execFile('swift', [scriptPath, reason], {
      timeout: 30000,
    })

    const result = stdout.trim()

    if (result === 'SUCCESS') {
      return {authenticated: true}
    }

    if (result.startsWith('UNAVAILABLE:')) {
      return {authenticated: true, skipped: true}
    }

    if (result.startsWith('FAILED:')) {
      return {
        authenticated: false,
        error: result.replace('FAILED:', ''),
      }
    }

    return {
      authenticated: false,
      error: 'Unknown authentication result',
    }
  } catch (error: any) {
    // If Swift script fails, fall back to availability check
    return {
      authenticated: false,
      error: error.message || 'Touch ID authentication failed',
    }
  }
}

/**
 * Check if a request requires Touch ID authentication
 * @param method - HTTP method
 */
export function requiresTouchIdAuth(method: string): boolean {
  const upperMethod = method.toUpperCase()
  // Only GET and HEAD requests are allowed without Touch ID
  return upperMethod !== 'GET' && upperMethod !== 'HEAD'
}
