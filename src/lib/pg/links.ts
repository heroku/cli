import {EssentialDatabaseNotSupportedError, InvalidLinkRemoteError} from '@heroku/sdk/extensions/data'

/**
 * Maps the SDK's link-validation errors to the messages the `pg:links:*`
 * commands have always shown. Other errors pass through unchanged.
 */
export function toLinkCommandError(error: unknown): unknown {
  if (error instanceof InvalidLinkRemoteError) return new Error('Remote database must be heroku-postgresql')
  if (error instanceof EssentialDatabaseNotSupportedError) return new Error('pg:links isn\'t available for Essential-tier databases.')
  return error
}
