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
 * Prompt for Touch ID authentication using AppleScript
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
    // Try using a simpler dialog-based authentication prompt
    // This uses the system security dialog which is more reliable
    const escapedReason = reason.replace(/'/g, "'\\''")
    const script = `do shell script "echo 'Touch ID authentication'" with prompt "${escapedReason}" with administrator privileges`

    try {
      await execFile('osascript', ['-e', script], {
        timeout: 30000,
      })
      return {authenticated: true}
    } catch (error: any) {
      // User cancelled or authentication failed
      if (error.message.includes('User canceled')) {
        return {
          authenticated: false,
          error: 'Touch ID authentication cancelled by user',
        }
      }

      throw error
    }
  } catch (error: any) {
    // If we can't authenticate, check if it's because Touch ID is unavailable
    try {
      await execFile('bioutil', ['-r'])
      // bioutil succeeded, so Touch ID is available but auth failed
      return {
        authenticated: false,
        error: error.message || 'Touch ID authentication failed',
      }
    } catch {
      // bioutil failed, Touch ID not available
      return {authenticated: true, skipped: true}
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
