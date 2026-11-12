import type {SniEndpoint} from '@heroku/types/3.sdk'

/** The SDK's `SniEndpointSelector`: by name, by an associated hostname, or neither. */
type SniEndpointSelector = {hostname: string; name?: never} | {hostname?: never; name: string} | {hostname?: never; name?: never}

/**
 * The SDK's SNI endpoint selector for `--name` / `--endpoint` (a hostname associated with the
 * certificate). The flags are exclusive, so at most one is set.
 */
export function sniEndpointSelector(flags: {endpoint?: string; name?: string}): SniEndpointSelector {
  if (flags.name !== undefined) return {name: flags.name}
  if (flags.endpoint !== undefined) return {hostname: flags.endpoint}
  return {}
}

/**
 * Name the flag that resolves an ambiguous certificate selection. The SDK's message can't
 * name CLI flags. Checked by name, not `instanceof`, so it doesn't depend on which copy of
 * the SDK threw.
 */
export function withSelectorFlagHint(error: unknown): unknown {
  if (error instanceof Error && error.name === 'SniEndpointAmbiguousError') {
    const {appIdentity, matches} = error as Error & {appIdentity: string; matches: SniEndpoint[]}
    return new Error(`${appIdentity} has ${matches.length} SSL certificates (${matches.map(e => e.name).join(', ')}). Pass --name to select one.`, {cause: error})
  }

  return error
}
