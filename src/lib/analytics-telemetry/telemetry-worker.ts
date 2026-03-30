/* eslint-disable n/no-process-exit */
/**
 * Telemetry worker process - runs in background to send telemetry data
 * This runs as a separate process to avoid blocking the main CLI
 */

import {sendTelemetry} from './global-telemetry.js'

// Read telemetry data from stdin
let inputData = ''

process.stdin.setEncoding('utf8')

process.stdin.on('data', chunk => {
  inputData += chunk
})

process.stdin.on('end', async () => {
  try {
    const parsed = JSON.parse(inputData)

    // If the data looks like an error, reconstruct it as an Error instance
    let telemetryData = parsed
    if (parsed.message && parsed.stack && (parsed.name === 'Error' || parsed.name)) {
      const error = new Error(parsed.message)
      error.name = parsed.name
      error.stack = parsed.stack
      // Copy over additional properties
      Object.assign(error, parsed)
      telemetryData = error
    }

    // Send telemetry (this will initialize OpenTelemetry and Sentry if needed)
    await sendTelemetry(telemetryData)

    process.exit(0)
  } catch {
    // Silently fail - don't let telemetry errors affect user experience
    process.exit(1)
  }
})

// Handle errors silently
process.on('uncaughtException', () => process.exit(1))
process.on('unhandledRejection', () => process.exit(1))
