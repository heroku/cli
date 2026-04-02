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
 * Setup telemetry handlers for signal handlers
 * Note: Normal command completion telemetry is handled by the postrun hook.
 * This only handles SIGINT/SIGTERM cases where hooks don't run.
 */
export function setupTelemetryHandlers(options: SetupTelemetryOptions): void {
  const {cliStartTime, computeDuration, enableTelemetry} = options

  if (!enableTelemetry) return

  // Note: beforeExit handler removed to avoid duplicate telemetry sends.
  // The postrun hook now handles normal command completion telemetry.

  process.on('SIGINT', () => {
    // Spawn background process to send telemetry
    const error: CLIError = Object.assign(new Error('Received SIGINT'), {
      cliRunDuration: computeDuration(cliStartTime),
      context: {
        isTTY: process.stdin.isTTY,
      },
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
