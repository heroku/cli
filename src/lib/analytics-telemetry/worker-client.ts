/* eslint-disable n/no-process-exit, no-var */

import {
  CLIError, spawnTelemetryWorker, telemetryDebug, TelemetryGlobal,
} from './telemetry-utils.js'

// Extend global with telemetry property
declare global {
  var cliTelemetry: TelemetryGlobal['cliTelemetry']
  var telemetrySent: TelemetryGlobal['telemetrySent']
}

interface SetupTelemetryOptions {
  cliStartTime: number
  computeDuration: (startTime: number) => number
  enableTelemetry: boolean
}

/**
 * Setup telemetry handlers for beforeExit and signal handlers
 * - beforeExit: Fallback for commands where postrun hook doesn't run (e.g., version, --help flags)
 * - postrun hook: Handles regular commands (sets telemetrySent flag to prevent duplicates)
 * - SIGINT/SIGTERM: Handles interrupted commands
 */
export function setupTelemetryHandlers(options: SetupTelemetryOptions): void {
  const {cliStartTime, computeDuration, enableTelemetry} = options

  if (!enableTelemetry) return

  // Fallback handler for commands that don't trigger postrun hook
  // (e.g., version, --version, --help flags handled by oclif)
  process.once('beforeExit', code => {
    // Only send if telemetry wasn't already sent by postrun hook
    if (globalThis.cliTelemetry && !globalThis.telemetrySent) {
      telemetryDebug('Telemetry enabled: beforeExit spawning worker to send telemetry for command: %s (postrun did not run)', globalThis.cliTelemetry.command)
      const cmdStartTime = globalThis.cliTelemetry.commandRunDuration
      globalThis.cliTelemetry.commandRunDuration = computeDuration(cmdStartTime)
      globalThis.cliTelemetry.exitCode = code
      globalThis.cliTelemetry.cliRunDuration = computeDuration(cliStartTime)

      spawnTelemetryWorker(globalThis.cliTelemetry)
      globalThis.telemetrySent = true
    }
  })

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
