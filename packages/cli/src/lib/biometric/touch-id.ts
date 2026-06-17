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
    // Use osascript with AppleScript to trigger Touch ID prompt via LocalAuthentication framework
    const script = `
use framework "LocalAuthentication"
use scripting additions

set context to current application's LAContext's alloc()'s init()
set myError to reference

set canEval to context's canEvaluatePolicy:2 |error|:(myError)
if not canEval then
  return "unavailable"
end if

set success to context's evaluatePolicy:2 localizedReason:"${reason.replace(/"/g, '\\"')}" reply:(missing value) |error|:(myError)

if success then
  return "success"
else
  return "failed"
end if
    `.trim()

    const {stdout, stderr} = await execFile('osascript', ['-l', 'JavaScript', '-e', script], {
      timeout: 30000, // 30 second timeout
    })

    const result = stdout.trim()

    if (result === 'success') {
      return {authenticated: true}
    }

    if (result === 'unavailable') {
      return {authenticated: true, skipped: true}
    }

    return {
      authenticated: false,
      error: stderr || 'Touch ID authentication failed',
    }
  } catch (error: any) {
    // If Touch ID fails or is canceled, deny authentication
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
