#!/usr/bin/env -S node --no-deprecation

import {execute, settings} from '@oclif/core'

// Enable performance tracking when oclif:perf is specified in DEBUG
if (process.env.DEBUG?.includes('oclif:perf') || process.env.DEBUG === 'oclif:*' || process.env.DEBUG === '*') {
  settings.performanceEnabled = true
}

process.env.HEROKU_UPDATE_INSTRUCTIONS = process.env.HEROKU_UPDATE_INSTRUCTIONS || 'update with: "npm update -g heroku"'

const now = new Date()
const cliStartTime = now.getTime()

const {isTelemetryEnabled, getTelemetryDisabledReason, telemetryDebug} = await import('../dist/lib/analytics-telemetry/telemetry-utils.js')
const enableTelemetry = isTelemetryEnabled()

if (enableTelemetry) {
  telemetryDebug('Telemetry enabled: setting up handlers (beforeExit, SIGINT, SIGTERM)')
  // Dynamically import telemetry modules
  const {setupTelemetryHandlers} = await import('../dist/lib/analytics-telemetry/worker-client.js')
  const {computeDuration} = await import('../dist/lib/analytics-telemetry/telemetry-utils.js')

  // Setup all telemetry handlers (beforeExit, SIGINT, SIGTERM)
  setupTelemetryHandlers({
    cliStartTime,
    computeDuration,
    enableTelemetry,
  })
} else {
  const reason = getTelemetryDisabledReason()
  telemetryDebug('Telemetry disabled (%s): skipping telemetry handler setup', reason)
}

await execute({dir: import.meta.url})
