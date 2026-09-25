import {Hook} from '@oclif/core/hooks'

const finallyHook: Hook<'finally'> = async function (options) {
  // Only process if there was an error
  if (!options.error) {
    return
  }

  // Record every error via the telemetry worker; telemetry-manager decides Sentry vs Honeycomb-only.
  const {getTelemetryDisabledReason, isTelemetryEnabled, spawnTelemetryWorker, telemetryDebug} = await import('../../lib/analytics-telemetry/telemetry-utils.js')

  // Use the consolidated telemetry check
  if (!isTelemetryEnabled()) {
    const reason = getTelemetryDisabledReason()
    telemetryDebug('Telemetry disabled (%s): skipping finally hook, not sending error: %s', reason, options.error.message)
    return
  }

  telemetryDebug('Telemetry enabled: finally hook spawning worker to send error: %s', options.error.message)
  // Spawn background process to send error without blocking
  spawnTelemetryWorker(options.error)
}

export default finallyHook
