/* eslint-disable n/no-process-exit */
/**
 * Telemetry worker process - runs in background to send telemetry data
 * This runs as a separate process to avoid blocking the main CLI
 */

import {telemetryDebug} from './telemetry-utils.js'
import {telemetryManager} from './telemetry-manager.js'

// Set maximum lifetime for worker process (10 seconds)
// This ensures the worker never hangs indefinitely due to network issues or other failures
const MAX_WORKER_LIFETIME_MS = 10000

setTimeout(() => {
  telemetryDebug('Worker timeout reached after %dms, force exiting', MAX_WORKER_LIFETIME_MS)
  process.exit(0)
}, MAX_WORKER_LIFETIME_MS)

// Read telemetry data from stdin
let inputData = ''

process.stdin.setEncoding('utf8')

process.stdin.on('data', chunk => {
  inputData += chunk
})

process.stdin.on('end', async () => {
  try {
    const parsed = JSON.parse(inputData)

    // Check if this is Herokulytics data using explicit type discriminator
    if (parsed._type === 'herokulytics') {
      // Handle Herokulytics data
      const {default: BackboardHerokulyticsClient} = await import('./backboard-herokulytics-client.js')
      const {Config} = await import('@oclif/core/config')

      // Recreate Config from serialized data
      const config = await Config.load()
      const client = new BackboardHerokulyticsClient(config)

      // Send herokulytics data
      await client.send(parsed)

      process.exit(0)
      return
    }

    // Otherwise, handle OTEL/Sentry telemetry data
    // If the data is an error, reconstruct it as an Error instance
    let telemetryData = parsed
    if (parsed._type === 'error') {
      const error = new Error(parsed.message)
      error.name = parsed.name
      error.stack = parsed.stack
      // Copy over additional properties
      Object.assign(error, parsed)
      telemetryData = error
    }

    // Send telemetry (this will initialize OpenTelemetry and Sentry if needed)
    await telemetryManager.sendTelemetry(telemetryData)

    process.exit(0)
  } catch {
    // Silently fail - don't let telemetry errors affect user experience
    process.exit(1)
  }
})

// Handle errors silently
process.on('uncaughtException', () => process.exit(1))
process.on('unhandledRejection', () => process.exit(1))
