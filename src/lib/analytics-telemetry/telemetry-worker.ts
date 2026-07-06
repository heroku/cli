/* eslint-disable n/no-process-exit, unicorn/no-process-exit */
/**
 * Telemetry worker process - runs in background to send telemetry data
 * This runs as a separate process to avoid blocking the main CLI
 */

import {telemetryManager} from './telemetry-manager.js'
import {
  CLIError, parseWorkerEnvelope, setVersion, TelemetryData, telemetryDebug,
} from './telemetry-utils.js'

// Set maximum lifetime for worker process (10 seconds)
// This ensures the worker never hangs indefinitely due to network issues or other failures
const MAX_WORKER_LIFETIME_MS = 10_000

/**
 * Close stderr before exiting to avoid keeping parent process alive
 * This is only necessary when stderr is inherited in DEBUG mode
 */
function exitWorker(code: number): void {
  // Close stderr if it was inherited (DEBUG mode)
  if (process.env.DEBUG) {
    try {
      // End stderr gracefully, flushing all pending writes
      // This properly releases the file descriptor reference to parent
      process.stderr.end(() => {
        process.exit(code)
      })
    } finally {
      // Fallback: ensure we exit even if end() fails or callback never fires
      // Use setImmediate to give the end() callback a chance to run first
      setImmediate(() => {
        process.exit(code)
      })
    }
  } else {
    process.exit(code)
  }
}

setTimeout(() => {
  telemetryDebug('Worker timeout reached after %dms, force exiting', MAX_WORKER_LIFETIME_MS)
  exitWorker(0)
}, MAX_WORKER_LIFETIME_MS)

// Read telemetry data from stdin
let inputData = ''

process.stdin.setEncoding('utf8')

process.stdin.on('data', chunk => {
  inputData += chunk
})

process.stdin.on('end', async () => {
  try {
    const envelope = parseWorkerEnvelope(inputData)
    // Restore the CLI version in this worker's module scope so any client
    // that lazily reads getVersion() (Sentry.init, OTEL tracer) sees the
    // real version instead of 'unknown'. Must happen before the first
    // client import below.
    setVersion(envelope.cliVersion)
    const parsed = envelope.payload

    // Check if this is Herokulytics data using explicit type discriminator
    if (parsed._type === 'herokulytics') {
      // Handle Herokulytics data
      const {default: BackboardHerokulyticsClient} = await import('./backboard-herokulytics-client.js')
      const {Config} = await import('@oclif/core/config')

      // Recreate Config from serialized data
      const config = await Config.load()
      const client = new BackboardHerokulyticsClient(config)

      await client.send({argv: parsed.argv, Command: parsed.Command})

      exitWorker(0)
      return
    }

    // Otherwise, handle OTEL/Sentry telemetry data
    // If the data is an error, reconstruct it as an Error instance
    let telemetryData: TelemetryData = parsed
    if (parsed._type === 'error') {
      const error = new Error(parsed.message) as CLIError
      error.name = parsed.name
      error.stack = parsed.stack
      // Copy over additional properties
      Object.assign(error, parsed)
      telemetryData = error
    }

    // Send telemetry (this will initialize OpenTelemetry and Sentry if needed)
    await telemetryManager.sendTelemetry(telemetryData)

    exitWorker(0)
  } catch {
    // Silently fail - don't let telemetry errors affect user experience
    exitWorker(1)
  }
})

// Handle errors silently
process.on('uncaughtException', () => exitWorker(1))
process.on('unhandledRejection', () => exitWorker(1))
