#!/usr/bin/env -S node --no-deprecation

import {
  Errors, flush, handle, run, settings,
} from '@oclif/core'

// Enable performance tracking when oclif:perf is specified in DEBUG
if (process.env.DEBUG?.includes('oclif:perf') || process.env.DEBUG === 'oclif:*' || process.env.DEBUG === '*') {
  settings.performanceEnabled = true
}

process.env.HEROKU_UPDATE_INSTRUCTIONS = process.env.HEROKU_UPDATE_INSTRUCTIONS || 'update with: "npm update -g heroku"'

const now = new Date()
const cliStartTime = now.getTime()

const {getTelemetryDisabledReason, isTelemetryEnabled, telemetryDebug} = await import('../dist/lib/analytics-telemetry/telemetry-utils.js')
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

// Mirrors @oclif/core's execute(), except an unsupported Node version's
// load-time crash is replaced with an actionable message (see
// src/lib/check-node-version.ts).
await run(process.argv.slice(2), import.meta.url)
  .then(async result => {
    flush()
    return result
  })
  .catch(async error => {
    const {isUnsupportedNodeCrash, UNSUPPORTED_NODE_ERROR_CODE, unsupportedNodeMessage} = await import('../dist/lib/check-node-version.js')
    if (isUnsupportedNodeCrash(process.versions.node, error)) {
      return handle(new Errors.CLIError(unsupportedNodeMessage(process.versions.node), {code: UNSUPPORTED_NODE_ERROR_CODE, exit: 1}))
    }

    return handle(error)
  })
