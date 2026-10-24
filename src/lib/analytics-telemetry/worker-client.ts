/* eslint-disable n/no-process-exit */

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
    // Defer termination to the next tick so every other SIGINT listener in this
    // emit runs first (e.g. the SDK's AbortController, dyno/ssh/forward/socks/mcp
    // connection teardown) instead of being cut off by a synchronous exit.
    // Draining the microtask queue in between also lets aborted in-flight
    // requests reject and unwind, and gives the worker's stdin write time to flush.
    setImmediate(() => process.exit(1))
  })

  process.on('SIGTERM', () => {
    // Spawn background process to send telemetry
    const error: CLIError = Object.assign(new Error('Received SIGTERM'), {
      cliRunDuration: computeDuration(cliStartTime),
    })
    spawnTelemetryWorker(error)
    // Defer termination; see the SIGINT handler above for why.
    setImmediate(() => process.exit(1))
  })
}
