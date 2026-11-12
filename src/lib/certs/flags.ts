import type {SniEndpoint} from '@heroku/types/3.sdk'

/** The SDK's SNI endpoint selector for `--name` / `--endpoint` (a hostname associated with the certificate). */
export function sniEndpointSelector(flags: {endpoint?: string; name?: string}): {hostname?: string; name?: string} {
  return {
    ...(flags.endpoint === undefined ? {} : {hostname: flags.endpoint}),
    ...(flags.name === undefined ? {} : {name: flags.name}),
  }
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
