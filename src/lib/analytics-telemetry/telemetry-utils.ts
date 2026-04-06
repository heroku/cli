import debug from 'debug'
import {spawn} from 'node:child_process'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const root = path.resolve(__dirname, '../../../package.json')

// Debug instance for telemetry operations
export const telemetryDebug = debug('heroku:analytics')
telemetryDebug.color = '147'

// Environment flags
export const isDev = process.env.IS_DEV_ENVIRONMENT === 'true'

// Cached values
let version: string | undefined
let cachedToken: string | undefined

export interface CLIError extends Error {
  _type?: 'error'
  cliRunDuration?: number | string
  code?: string
  context?: {
    isTTY?: boolean
  }
  http?: {
    statusCode?: number
  }
  oclif?: {
    exit?: number
  }
  statusCode?: number
}

// Herokulytics data type
export interface HerokulyticsData {
  _type: 'herokulytics'
  argv: string[]
  Command: {
    id: string
    plugin?: {
      name: string
      version: string
    }
  }
}

export interface Telemetry {
  _type: 'otel'
  cliRunDuration: number
  command: string
  commandRunDuration: number
  exitCode: number
  exitState: string
  isTTY: boolean | undefined
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

// Union type for data that can be sent to telemetry
export type TelemetryData = CLIError | Telemetry

export interface TelemetryGlobal {
  cliTelemetry?: Telemetry
}

// All data types that can be sent via worker
export type WorkerData = HerokulyticsData | TelemetryData

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
 * Lazy-loads @heroku-cli/command and @oclif/core/config to avoid loading them during CLI init
 */
export async function getToken(): Promise<string | undefined> {
  if (cachedToken !== undefined) {
    return cachedToken
  }

  try {
    const [{APIClient}, {Config}] = await Promise.all([
      import('@heroku-cli/command'),
      import('@oclif/core/config'),
    ])
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
 * Serialize data for telemetry worker, handling Error objects specially
 */
export function serializeTelemetryData(data: WorkerData): string {
  // If it's an Error object, convert to plain object with all properties
  if (data instanceof Error) {
    const errorData = data as CLIError
    return JSON.stringify({
      // Include any other enumerable properties first
      ...data,
      // Then override with important properties to ensure they're captured
      _type: 'error',
      cliRunDuration: errorData.cliRunDuration,
      code: errorData.code,
      http: errorData.http,
      message: errorData.message,
      name: errorData.name,
      oclif: errorData.oclif,
      stack: errorData.stack,
      statusCode: errorData.statusCode,
    })
  }

  return JSON.stringify(data)
}

/**
 * Set CLI version (called once during setup)
 */
export function setVersion(v: string): void {
  version = v
}

/**
 * Spawn telemetry worker process in background
 * This avoids blocking the main CLI process with telemetry overhead
 */
export function spawnTelemetryWorker(data: WorkerData): void {
  try {
    const workerPath = path.join(__dirname, '..', '..', '..', 'dist', 'lib', 'analytics-telemetry', 'telemetry-worker.js')
    const child = spawn(process.execPath, [workerPath], {
      detached: true,
      // Only inherit stderr when debugging to avoid keeping parent process alive
      stdio: ['pipe', 'ignore', process.env.DEBUG ? 'inherit' : 'ignore'],
      // On Windows, prevent console window from appearing
      windowsHide: true,
    })

    // Send data via stdin
    child.stdin.write(serializeTelemetryData(data))
    child.stdin.end()

    // Detach from parent so it can exit immediately
    child.unref()
  } catch {
    // Silently fail - don't let telemetry errors affect user experience
  }
}
