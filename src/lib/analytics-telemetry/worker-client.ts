/* eslint-disable n/no-process-exit */
import {CLIError, spawnTelemetryWorker, TelemetryGlobal} from './telemetry-utils.js'

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
