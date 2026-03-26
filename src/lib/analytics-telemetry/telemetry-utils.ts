import {APIClient} from '@heroku-cli/command'
import {Config} from '@oclif/core/config'
import debug from 'debug'
import path from 'path'
import {fileURLToPath} from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const root = path.resolve(__dirname, '../../../package.json')

// Debug instance for telemetry operations
export const telemetryDebug = debug('analytics-telemetry')

// Environment flags
export const isDev = process.env.IS_DEV_ENVIRONMENT === 'true'
export const isTelemetryDisabled = process.env.DISABLE_TELEMETRY === 'true'

// Cached values
let version: string | undefined
let cachedToken: string | undefined

export interface CLIError extends Error {
  cliRunDuration?: string
}

export interface Telemetry {
  cliRunDuration: number
  command: string
  commandRunDuration: number
  exitCode: number
  exitState: string
  isVersionOrHelp: boolean
  lifecycleHookCompletion: {
    command_not_found: boolean
    init: boolean
    postrun: boolean
    prerun: boolean
  }
  os: string
  version: string
}

// Types
export interface TelemetryGlobal extends NodeJS.Global {
  cliTelemetry?: Telemetry
}

/**
 * Compute duration from a start time to now
 */
export function computeDuration(cmdStartTime: number): number {
  const now = new Date()
  const cmdFinishTime = now.getTime()
  return cmdFinishTime - cmdStartTime
}

/**
 * Get authentication token, cached to avoid recreating Config/APIClient
 */
export function getToken(): string | undefined {
  if (cachedToken !== undefined) {
    return cachedToken
  }

  try {
    const config = new Config({root})
    const heroku = new APIClient(config)
    cachedToken = heroku.auth
    return cachedToken
  } catch {
    // If config initialization fails, return empty string
    cachedToken = ''
    return cachedToken
  }
}

/**
 * Get CLI version
 */
export function getVersion(): string {
  return version || 'unknown'
}

/**
 * Check if telemetry is enabled based on environment variables
 */
export function isTelemetryEnabled(): boolean {
  if (process.env.DISABLE_TELEMETRY === 'true') return false
  if (process.platform === 'win32' && process.env.ENABLE_WINDOWS_TELEMETRY !== 'true') return false
  if (process.env.IS_HEROKU_TEST_ENV === 'true') return false
  return true
}

/**
 * Set CLI version (called once during setup)
 */
export function setVersion(v: string): void {
  version = v
}
