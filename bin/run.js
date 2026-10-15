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
    // Only the guard lookup is protected: if the helper can't load (e.g. a
    // stale build), fall through and report the original error instead.
    let unsupportedNodeError
    try {
      const {isUnsupportedNodeCrash, UNSUPPORTED_NODE_ERROR_CODE, unsupportedNodeMessage} = await import('../dist/lib/check-node-version.js')
      if (isUnsupportedNodeCrash(process.versions.node, error)) {
        // Dependency-free read of the required Node range. Any failure leaves
        // it undefined, which gives the generic wording.
        let enginesRange
        try {
          const {readFileSync} = await import('node:fs')
          enginesRange = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).engines.node
        } catch {
          // Ignore: the message falls back to generic wording.
        }

        unsupportedNodeError = new Errors.CLIError(unsupportedNodeMessage(process.versions.node, enginesRange), {code: UNSUPPORTED_NODE_ERROR_CODE, exit: 1})
      }
    } catch {
      // Ignore: fall back to the original error below.
    }

    if (unsupportedNodeError) {
      return handle(unsupportedNodeError)
    }

    return handle(error)
  })
