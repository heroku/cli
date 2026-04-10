import {Hook} from '@oclif/core/hooks'

/**
 * Check if an error is a user error (not a bug) that should be filtered out
 * Returns true if the error should NOT be sent to Sentry
 */
function isUserError(error: any): boolean {
  // Filter out 4xx HTTP errors (client errors)
  if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
    return true
  }

  // Check for http.statusCode (e.g., HerokuAPIError)
  if (error.http?.statusCode && error.http.statusCode >= 400 && error.http.statusCode < 500) {
    return true
  }

  // Filter out "command not found" errors (user typos, not bugs)
  // Message format: "Run <bin> help for a list of available commands."
  if (error.message && error.message.includes('Run') && error.message.includes('help') && error.message.includes('for a list of available commands')) {
    return true
  }

  // Also check for exit code 127 (command not found)
  if (error.oclif?.exit === 127) {
    return true
  }

  return false
}

const finallyHook: Hook<'finally'> = async function (options) {
  // Only process if there was an error
  if (!options.error) {
    return
  }

  // Filter out user errors (not bugs)
  if (isUserError(options.error)) {
    return
  }

  const {isTelemetryEnabled, getTelemetryDisabledReason, spawnTelemetryWorker, telemetryDebug} = await import('../../lib/analytics-telemetry/telemetry-utils.js')

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
