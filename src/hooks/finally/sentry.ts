import {Hook} from '@oclif/core/hooks'

/**
 * Check if an error is a 4xx client error (user error, not a bug)
 * Returns true if the error should be filtered out (not sent to Sentry)
 */
function is4xxError(error: any): boolean {
  // Check for statusCode property directly on error (e.g., HTTPError)
  if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
    return true
  }

  // Check for http.statusCode (e.g., HerokuAPIError)
  if (error.http?.statusCode && error.http.statusCode >= 400 && error.http.statusCode < 500) {
    return true
  }

  return false
}

const finallyHook: Hook<'finally'> = async function (options) {
  // Only process if there was an error
  if (!options.error) {
    return
  }

  // Filter out 4xx errors (user errors, not bugs)
  if (is4xxError(options.error)) {
    return
  }

  const telemetry = await import('../../global_telemetry.js')

  // Use the consolidated telemetry check
  if (!telemetry.isTelemetryEnabled()) {
    return
  }

  // Send error to both Honeycomb and Sentry
  await telemetry.sendTelemetry(options.error)
}

export default finallyHook
