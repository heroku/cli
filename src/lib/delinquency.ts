import {type DelinquencyResource, type DelinquencySchedule, formatDelinquencyWarning} from '@heroku/sdk/extensions/platform'

/**
 * Emit the platform's delinquency warning for a resource when there is one to
 * show. {@link formatDelinquencyWarning} returns `undefined` when nothing is
 * scheduled, so this is a no-op in the common case. Collapses the
 * format → guard → `warn` trio that every command reading `getWithDelinquency`
 * would otherwise repeat.
 */
export function warnDelinquency(
  command: {warn(input: string): unknown},
  resource: DelinquencyResource,
  delinquency: DelinquencySchedule | null | undefined,
): void {
  const warning = formatDelinquencyWarning(resource, delinquency)
  if (warning) command.warn(warning)
}
