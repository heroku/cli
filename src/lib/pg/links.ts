import {EssentialDatabaseNotSupportedError} from '@heroku/sdk/extensions/data'

/**
 * Maps the SDK's Essential-tier error to the message the `pg:links:*`
 * commands have always shown. Other errors, including the SDK's
 * `InvalidLinkRemoteError`, pass through unchanged.
 */
export function toLinkCommandError(error: unknown): unknown {
  if (error instanceof EssentialDatabaseNotSupportedError) return new Error('pg:links isn\'t available for Essential-tier databases.')
  return error
}
