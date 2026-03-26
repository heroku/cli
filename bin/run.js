#!/usr/bin/env -S node --no-deprecation

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

if (enableTelemetry) {
  // Dynamically import telemetry modules
  const {setupTelemetryHandlers} = await import('../dist/lib/analytics-telemetry/worker-client.js')
  const {computeDuration} = await import('../dist/lib/analytics-telemetry/telemetry-utils.js')

  // Setup all telemetry handlers (beforeExit, SIGINT, SIGTERM)
  setupTelemetryHandlers({
    cliStartTime,
    computeDuration,
    enableTelemetry,
  })
}

await execute({dir: import.meta.url})
