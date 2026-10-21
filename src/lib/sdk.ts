import {APIClient, vars} from '@heroku-cli/command'
import {HerokuApiClient} from '@heroku/heroku-fetch'
import {
  type HerokuApiClientOptions, HerokuSDK, type HerokuSDKOptions, type ResourceExtension,
} from '@heroku/sdk'
import {warn as oclifWarn} from '@oclif/core/errors'

/**
 * The CLI's single, canonical way to construct a `HerokuSDK` (or, rarely, a raw
 * `HerokuApiClient`). An ESLint `no-restricted-syntax` guard bans
 * `new HerokuSDK(...)` / `new HerokuApiClient(...)` outside this file, so token
 * resolution and the platform `baseUrl` are threaded here instead of at ~170
 * call sites — SDK calls resolve the CLI user's credentials via `APIClient` (the
 * same path as the rest of the CLI) rather than heroku-fetch's own default.
 */

/**
 * Lazy token provider backed by the CLI's `APIClient`. Passing heroku-fetch a
 * function* (not a snapshot) means a `heroku login`/`logout` after the SDK is
 * built is still honored — the token is re-resolved per request.
 *
 * `getAuthEntry()` reuses `APIClient`'s precedence (cached `_auth` →
 * `HEROKU_API_KEY` → keychain/netrc), so the env override and stored credentials
 * keep working with no second credential reader. On a miss we coerce to `''`:
 * heroku-fetch only sends `Authorization` for a truthy token, so an empty string
 * yields a server `401` (not a client-side throw — construct-but-never-fetch
 * paths like shell completion stay safe) and satisfies heroku-fetch's
 * `string`-returning `TokenProvider`.
 */
export const tokenFor = (heroku: Pick<APIClient, 'getAuthEntry'>) => async (): Promise<string> =>
  (await heroku.getAuthEntry())?.token ?? ''

/**
 * @internal
 *
 * Exported only so the wiring (token present, default `warn` sink, `baseUrl` on
 * the *platform* service and nowhere else, caller overrides winning) is
 * unit-testable without constructing a real client. Prefer `createSDK` at call
 * sites.
 *
 * `warn` is defaulted on the common `clientOptions` so Heroku API warnings
 * (deprecation and billing/account notices) surface to the user. heroku-fetch
 * detects, normalizes, and de-duplicates the server's `x-heroku-warning` /
 * `warning-message` headers and invokes this callback once per unique message,
 * so the sink only emits — oclif's `warn` prints it to stderr with a `Warning:`
 * prefix. On the common `clientOptions`, it reaches every per-service client the
 * SDK builds.
 *
 * `baseUrl` is set on `clientOptionsByService.platform` — never on the common
 * `clientOptions` — because a shared `baseUrl` clobbers every service's own host
 * (metrics, data, repositories resolve different hosts). `vars.apiUrl` is the
 * CLI's `HEROKU_HOST`-aware platform URL, which equals the SDK's own production
 * default when `HEROKU_HOST` is unset, so it is a no-op for normal users and the
 * correct override for staging. Caller-supplied `clientOptions` (including
 * `warn` and `token`) and `clientOptionsByService.platform` still win via the
 * spreads — a caller can override the sink or disable it with `warn: undefined`.
 */
export function sdkOptions<Exts extends readonly ResourceExtension[]>(
  heroku: APIClient,
  opts: HerokuSDKOptions<Exts> = {},
): HerokuSDKOptions<Exts> {
  return {
    ...opts,
    clientOptions: {token: tokenFor(heroku), warn: oclifWarn, ...opts.clientOptions},
    clientOptionsByService: {
      ...opts.clientOptionsByService,
      platform: {baseUrl: vars.apiUrl, ...opts.clientOptionsByService?.platform},
    },
  }
}

/**
 * Construct a `HerokuSDK` with the CLI-resolved token and platform host applied.
 * This is the default way to build the SDK anywhere in the CLI.
 */
export function createSDK<const Exts extends readonly ResourceExtension[] = readonly ResourceExtension[]>(
  heroku: APIClient,
  opts: HerokuSDKOptions<Exts> = {},
): HerokuSDK<Exts> {
  return new HerokuSDK<Exts>(sdkOptions(heroku, opts))
}

/**
 * @internal
 * `new HerokuApiClient`. Exported for the same testability reason as
 * {@link sdkOptions}; prefer `createApiClient` at call sites.
 *
 * A `HerokuApiClient` is a single-service client, so `baseUrl` lives on the
 * common options here (there is no other service to clobber). The default `warn`
 * sink is applied for the same reason as {@link sdkOptions} — so raw-client calls
 * surface Heroku API warnings too, not just the SDK path. Caller overrides win
 * via the spread — e.g. the status command passes `service: 'custom'` and an
 * empty `token` to build an intentionally unauthenticated client against a
 * custom host, and shell completion passes `warn: undefined` to stay silent.
 */
export function apiClientOptions(
  heroku: Pick<APIClient, 'getAuthEntry'>,
  opts: HerokuApiClientOptions = {},
): HerokuApiClientOptions {
  return {
    baseUrl: vars.apiUrl, token: tokenFor(heroku), warn: oclifWarn, ...opts,
  }
}

/**
 * Construct a raw `HerokuApiClient` with the CLI-resolved token and platform
 * host applied. Use only where the typed SDK cannot serve the request (e.g. an
 * endpoint the generated routes don't expose); otherwise prefer `createSDK`.
 */
export function createApiClient(
  heroku: Pick<APIClient, 'getAuthEntry'>,
  opts: HerokuApiClientOptions = {},
): HerokuApiClient {
  return new HerokuApiClient(apiClientOptions(heroku, opts))
}

/**
 * Construct a `HerokuApiClient` for an intentionally unauthenticated request to
 * a third-party host (for example the public Heroku/Salesforce status APIs). No
 * token is sent, so no CLI credential resolution runs and no `APIClient` is
 * needed at the call site. Lives here so the `new HerokuApiClient` stays inside
 * the sdk.ts lint boundary.
 */
export function createUnauthenticatedClient(baseUrl: string): HerokuApiClient {
  return new HerokuApiClient({baseUrl, service: 'custom', token: ''})
}
