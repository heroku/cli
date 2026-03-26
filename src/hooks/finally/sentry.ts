import {spawn} from 'node:child_process'
import {fileURLToPath} from 'node:url'
import {dirname, join} from 'node:path'
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

/**
 * Serialize data for telemetry worker, handling Error objects specially
 */
function serializeTelemetryData(data: any): string {
  // If it's an Error object, convert to plain object with all properties
  if (data instanceof Error) {
    return JSON.stringify({
      // Include any other enumerable properties first
      ...data,
      // Then override with important properties to ensure they're captured
      message: data.message,
      name: data.name,
      stack: data.stack,
      code: (data as any).code,
      statusCode: (data as any).statusCode,
      http: (data as any).http,
      oclif: (data as any).oclif,
    })
  }

  return JSON.stringify(data)
}

/**
 * Spawn telemetry worker process in background
 * This avoids blocking the main CLI process with telemetry overhead
 */
function spawnTelemetryWorker(data: any) {
  try {
    const __dirname = dirname(fileURLToPath(import.meta.url))
    const workerPath = join(__dirname, '..', '..', 'dist', 'telemetry_worker.js')
    const child = spawn(process.execPath, [workerPath], {
      detached: true,
      // Keep stderr attached to see DEBUG output, but ignore stdout
      stdio: ['pipe', 'ignore', 'inherit'],
    })

    // Send data via stdin
    child.stdin.write(serializeTelemetryData(data))
    child.stdin.end()

    // Detach from parent so it can exit immediately
    child.unref()
  } catch {
    // Silently fail - don't let telemetry errors affect user experience
  }
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

  const telemetry = await import('../../global_telemetry.js')

  // Use the consolidated telemetry check
  if (!telemetry.isTelemetryEnabled()) {
    return
  }

  // Spawn background process to send error without blocking
  spawnTelemetryWorker(options.error)
}

export default finallyHook
