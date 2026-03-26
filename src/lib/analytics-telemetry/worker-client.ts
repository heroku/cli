/* eslint-disable n/no-process-exit */
import {spawn} from 'node:child_process'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

import {CLIError, TelemetryData, TelemetryGlobal} from './telemetry-utils.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Extend global with telemetry property
declare global {
  // eslint-disable-next-line no-var
  var cliTelemetry: TelemetryGlobal['cliTelemetry']
}

interface SetupTelemetryOptions {
  cliStartTime: number
  computeDuration: (startTime: number) => number
  enableTelemetry: boolean
}

/**
 * Setup telemetry handlers for beforeExit and signal handlers
 * This centralizes all telemetry worker spawning logic
 */
export function setupTelemetryHandlers(options: SetupTelemetryOptions): void {
  const {cliStartTime, computeDuration, enableTelemetry} = options

  if (!enableTelemetry) return

  process.once('beforeExit', code => {
    // capture as successful exit
    if (global.cliTelemetry) {
      if (global.cliTelemetry.isVersionOrHelp) {
        const cmdStartTime = global.cliTelemetry.commandRunDuration
        global.cliTelemetry.commandRunDuration = computeDuration(cmdStartTime)
      }

      global.cliTelemetry.exitCode = code
      global.cliTelemetry.cliRunDuration = computeDuration(cliStartTime)
      const telemetryData = global.cliTelemetry

      // Spawn background process to send telemetry without blocking exit
      spawnTelemetryWorker(telemetryData)
    }
  })

  process.on('SIGINT', () => {
    // Spawn background process to send telemetry
    const error: CLIError = Object.assign(new Error('Received SIGINT'), {
      cliRunDuration: computeDuration(cliStartTime),
    })
    spawnTelemetryWorker(error)
    process.exit(1)
  })

  process.on('SIGTERM', () => {
    // Spawn background process to send telemetry
    const error: CLIError = Object.assign(new Error('Received SIGTERM'), {
      cliRunDuration: computeDuration(cliStartTime),
    })
    spawnTelemetryWorker(error)
    process.exit(1)
  })
}

/**
 * Spawn telemetry worker process in background
 * This avoids blocking the main CLI process with telemetry overhead
 */
export function spawnTelemetryWorker(data: TelemetryData): void {
  try {
    const workerPath = join(__dirname, '..', '..', '..', 'dist', 'lib', 'analytics-telemetry', 'telemetry-worker.js')
    const child = spawn(process.execPath, [workerPath], {
      detached: true,
      // Keep stderr attached to see DEBUG output, but ignore stdout
      stdio: ['pipe', 'ignore', 'inherit'],
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

/**
 * Serialize data for telemetry worker, handling Error objects specially
 */
function serializeTelemetryData(data: TelemetryData): string {
  // If it's an Error object, convert to plain object with all properties
  if (data instanceof Error) {
    const errorData = data as CLIError
    return JSON.stringify({
      // Include any other enumerable properties first
      ...data,
      // Then override with important properties to ensure they're captured
      cliRunDuration: errorData.cliRunDuration,
      code: errorData.code,
      message: errorData.message,
      name: errorData.name,
      stack: errorData.stack,
    })
  }

  return JSON.stringify(data)
}
