import {NONINTERACTIVE_LOGIN_ERROR_CODE} from '@heroku-cli/command'

import {CLIError} from './telemetry-utils.js'

// Actionable user-guidance messages the CI git helper rejects with
// (src/lib/ci/git.ts) — detached HEAD / not in a git repository.
const GIT_USER_ERROR_MESSAGES = [
  'Please checkout a branch before running this command',
  'Please run this command from the directory containing your project\'s git repo',
]

/**
 * Single source of truth for whether an error is an *expected* user/environment
 * condition rather than a CLI bug.
 *
 * Expected errors are still recorded in Honeycomb (via the OTEL client) so we
 * can measure how often they happen, but are excluded from Sentry so they don't
 * pollute error reporting. The `finally` hook no longer drops errors; it always
 * records them, and `telemetry-manager` uses this classifier to decide whether
 * to ALSO send to Sentry.
 */
export function isExpectedError(error: CLIError): boolean {
  // 4xx client errors (e.g. HerokuAPIError) — the user's request was rejected,
  // not a CLI bug. statusCode and http.statusCode are checked independently.
  if (is4xx(error.statusCode) || is4xx(error.http?.statusCode)) {
    return true
  }

  // Command not found (user typo): oclif exit code 127, or the not-found message.
  if (isCommandNotFound(error)) {
    return true
  }

  // The user interrupted with Ctrl+C.
  if (error.message === 'Received SIGINT') {
    return true
  }

  // An interactive login was required but stdin is not a TTY (piped input, CI,
  // or a 401 re-auth) — thrown by @heroku-cli/command.
  if (error.code === NONINTERACTIVE_LOGIN_ERROR_CODE) {
    return true
  }

  // CI git helper guidance (detached HEAD / not in a git repo).
  if (GIT_USER_ERROR_MESSAGES.some(message => error.message.includes(message))) {
    return true
  }

  return false
}

function is4xx(statusCode?: number): boolean {
  return typeof statusCode === 'number' && statusCode >= 400 && statusCode < 500
}

function isCommandNotFound(error: CLIError): boolean {
  if (error.oclif?.exit === 127) {
    return true
  }

  // Message format: "Run <bin> help for a list of available commands."
  const {message} = error
  return message.includes('Run') && message.includes('help') && message.includes('for a list of available commands')
}
