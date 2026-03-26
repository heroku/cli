/* eslint-disable n/no-process-exit */
import {spawn} from 'node:child_process'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

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
    if ((global as any).cliTelemetry) {
      if ((global as any).cliTelemetry.isVersionOrHelp) {
        const cmdStartTime = (global as any).cliTelemetry.commandRunDuration;
        (global as any).cliTelemetry.commandRunDuration = computeDuration(cmdStartTime)
      }

      (global as any).cliTelemetry.exitCode = code;
      (global as any).cliTelemetry.cliRunDuration = computeDuration(cliStartTime)
      const telemetryData = (global as any).cliTelemetry

      // Spawn background process to send telemetry without blocking exit
      spawnTelemetryWorker(telemetryData)
    }
  })

  process.on('SIGINT', () => {
    // Spawn background process to send telemetry
    const error = new Error('Received SIGINT') as any
    error.cliRunDuration = computeDuration(cliStartTime)
    spawnTelemetryWorker(error)
    process.exit(1)
  })

  process.on('SIGTERM', () => {
    // Spawn background process to send telemetry
    const error = new Error('Received SIGTERM') as any
    error.cliRunDuration = computeDuration(cliStartTime)
    spawnTelemetryWorker(error)
    process.exit(1)
  })
}

/**
 * Spawn telemetry worker process in background
 * This avoids blocking the main CLI process with telemetry overhead
 */
export function spawnTelemetryWorker(data: any): void {
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
function serializeTelemetryData(data: any): string {
  // If it's an Error object, convert to plain object with all properties
  if (data instanceof Error) {
    return JSON.stringify({
      // Include any other enumerable properties first
      ...data,
      // Then override with important properties to ensure they're captured
      cliRunDuration: (data as any).cliRunDuration,
      code: (data as any).code,
      message: data.message,
      name: data.name,
      stack: data.stack,
    })
  }

  return JSON.stringify(data)
}
