#!/usr/bin/env -S node --no-deprecation
/* eslint-disable n/no-process-exit */
/* eslint-disable n/no-unpublished-bin */

import {execute, settings} from '@oclif/core'

// Enable performance tracking when DEBUG=oclif:perf or DEBUG=* is set
if (process.env.DEBUG?.includes('oclif:perf') || process.env.DEBUG === '*') {
  settings.performanceEnabled = true
}

process.env.HEROKU_UPDATE_INSTRUCTIONS = process.env.HEROKU_UPDATE_INSTRUCTIONS || 'update with: "npm update -g heroku"'

const now = new Date()
const cliStartTime = now.getTime()

// Skip telemetry entirely on Windows for performance (unless explicitly enabled)
const enableTelemetry = process.platform !== 'win32' || process.env.ENABLE_WINDOWS_TELEMETRY === 'true'
let globalTelemetry

if (enableTelemetry) {
  // Dynamically import telemetry only when needed
  globalTelemetry = await import('../dist/global_telemetry.js')
}

process.once('beforeExit', code => {
  if (!enableTelemetry) return

  // capture as successful exit
  if (global.cliTelemetry) {
    if (global.cliTelemetry.isVersionOrHelp) {
      const cmdStartTime = global.cliTelemetry.commandRunDuration
      global.cliTelemetry.commandRunDuration = globalTelemetry.computeDuration(cmdStartTime)
    }

    global.cliTelemetry.exitCode = code
    global.cliTelemetry.cliRunDuration = globalTelemetry.computeDuration(cliStartTime)
    const telemetryData = global.cliTelemetry

    // Fire-and-forget: Start sending telemetry but don't block exit
    // The async HTTP request will keep the event loop alive naturally
    globalTelemetry.sendTelemetry(telemetryData).catch(() => {})
  }
})

process.on('SIGINT', () => {
  if (enableTelemetry) {
    // Fire-and-forget: attempt to send telemetry but don't block exit
    const error = new Error('Received SIGINT')
    error.cliRunDuration = globalTelemetry.computeDuration(cliStartTime)
    globalTelemetry.sendTelemetry(error).catch(() => {})
  }

  process.exit(1)
})

process.on('SIGTERM', () => {
  if (enableTelemetry) {
    // Fire-and-forget: attempt to send telemetry but don't block exit
    const error = new Error('Received SIGTERM')
    error.cliRunDuration = globalTelemetry.computeDuration(cliStartTime)
    globalTelemetry.sendTelemetry(error).catch(() => {})
  }

  process.exit(1)
})

// Note: Instrumentation initialization removed for performance
// It will be lazy-loaded when telemetry is actually sent (if needed)

await execute({dir: import.meta.url})
