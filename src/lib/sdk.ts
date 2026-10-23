import {APIClient, vars} from '@heroku-cli/command'
import {HerokuApiClient} from '@heroku/heroku-fetch'
import {
  type HerokuApiClientOptions, HerokuSDK, type HerokuSDKOptions, type ResourceExtension,
} from '@heroku/sdk'
import {warn as oclifWarn} from '@oclif/core/errors'
import {readFileSync} from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

/**
 * The CLI's single, canonical way to construct a `HerokuSDK` (or, rarely, a raw
 * `HerokuApiClient`). An ESLint `no-restricted-syntax` guard bans
 * `new HerokuSDK(...)` / `new HerokuApiClient(...)` outside this file, so token
 * resolution and the platform `baseUrl` are threaded here instead of at ~170
 * call sites — SDK calls resolve the CLI user's credentials via `APIClient` (the
 * same path as the rest of the CLI) rather than heroku-fetch's own default.
 */

/**
 * The CLI's User-Agent identity, applied to every SDK request so Heroku's
 * request logs can attribute CLI traffic. We hand heroku-fetch the structured
 * `{name, version}` option, which it applies to every client it builds —
 * including the custom-host stream clients (logplex/busl/exec), which inherit
 * `userAgent` while their `headers` are stripped to keep credentials from
 * crossing origins. heroku-fetch assembles it into the canonical RFC 9110
 * §10.1.5 form: a `product` token with a platform/runtime comment,
 * `heroku-cli/<version> (<platform>; <arch>) Node.js/<version>`. The version is
 * read from the CLI's own `package.json` (the same source oclif derives
 * `config.version` from), so the helper stays usable from `src/lib/` call sites
 * that only hold an `APIClient`.
 */
const {version: cliVersion} = JSON.parse(readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../package.json'), 'utf8')) as {version: string}
const userAgent = {name: 'heroku-cli', version: cliVersion}

let abortController: AbortController | undefined
let onInterrupt: (() => void) | undefined

/**
 * Process-wide cancellation signal for SDK requests. A CLI invocation is a
 * single process, so one controller scoped to the process lifetime is the right
 * granularity — there is no narrower unit to cancel. It is created lazily on
 * first use and reused across every `createSDK` call, so exactly one pair of
 * signal listeners is registered at a time no matter how many clients a command
 * builds.
 *
 * `SIGINT`/`SIGTERM` abort it, so an interrupted command's in-flight SDK
 * requests reject with an `AbortError` instead of being orphaned by process
 * teardown. The first Ctrl-C aborts in-flight work (which rejects and unwinds
 * the command to exit); a second, with the one-shot listeners already spent,
 * falls through to Node's default handler for a hard exit.
 *
 * An aborted signal stays aborted, so once it has fired the next call hands back
 * a fresh controller (swapping in fresh listeners): a client built during
 * post-abort cleanup is cancellable on its own terms rather than born already
 * aborted. Reusing the live controller otherwise keeps repeated calls from
 * accumulating listeners.
 */
function cliAbortSignal(): AbortSignal {
  if (!abortController || abortController.signal.aborted) {
    if (onInterrupt) {
      process.removeListener('SIGINT', onInterrupt)
      process.removeListener('SIGTERM', onInterrupt)
    }

    const controller = new AbortController()
    abortController = controller
    onInterrupt = () => controller.abort()
    process.once('SIGINT', onInterrupt)
    process.once('SIGTERM', onInterrupt)
  }

  return abortController.signal
}

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
 * Exported only so the wiring (token present, default `warn` sink, `userAgent`,
 * and cancellation `signal`; `baseUrl` on the *platform* service and nowhere
 * else; caller overrides winning) is unit-testable without constructing a real
 * client. Prefer `createSDK` at call sites.
 *
 * `userAgent` is defaulted on the common `clientOptions` so every service client
 * identifies CLI traffic in Heroku's request logs, including the custom-host
 * stream clients the SDK builds internally (which inherit `userAgent`). A
 * caller's own `userAgent` wins via the spread.
 *
 * `warn` is defaulted on the common `clientOptions` so Heroku API warnings
 * (deprecation and billing/account notices) surface to the user. heroku-fetch
 * detects, normalizes, and de-duplicates the server's `x-heroku-warning` /
 * `warning-message` headers and invokes this callback once per unique message,
 * so the sink only emits — oclif's `warn` prints it to stderr with a `Warning:`
 * prefix. On the common `clientOptions`, it reaches every per-service client the
 * SDK builds.
 *
 * `signal` is defaulted on the common `clientOptions` from the process-wide
 * {@link cliAbortSignal}, so a `SIGINT`/`SIGTERM` aborts the in-flight requests
 * of every client the SDK builds — heroku-fetch folds a client-level signal into
 * each request. One process-lifetime signal on shared clients suits the
 * short-lived CLI. A caller can override it (or drop it with `signal: undefined`)
 * via `clientOptions`.
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
    clientOptions: {
      signal: cliAbortSignal(),
      token: tokenFor(heroku),
      userAgent,
      warn: oclifWarn,
      ...opts.clientOptions,
    },
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
 * surface Heroku API warnings too, not just the SDK path. The `userAgent`
 * identity and the process-wide cancellation `signal` are defaulted for the same
 * reason, so raw-client calls (e.g. `ps -x`) are attributable in request logs
 * and abort on `SIGINT`/`SIGTERM`. Caller overrides win via the spread — e.g.
 * the status command passes `service: 'custom'` and an empty `token` to build an
 * intentionally unauthenticated client against a custom host, and shell
 * completion passes `warn: undefined` to stay silent.
 */
export function apiClientOptions(
  heroku: Pick<APIClient, 'getAuthEntry'>,
  opts: HerokuApiClientOptions = {},
): HerokuApiClientOptions {
  return {
    baseUrl: vars.apiUrl, signal: cliAbortSignal(), token: tokenFor(heroku), userAgent, warn: oclifWarn, ...opts,
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
 * needed at the call site. It still carries the CLI `userAgent` and the
 * process-wide cancellation `signal`, so these requests stay attributable and
 * abort on `SIGINT`/`SIGTERM`. Lives here so the `new HerokuApiClient` stays
 * inside the sdk.ts lint boundary.
 */
export function createUnauthenticatedClient(baseUrl: string): HerokuApiClient {
  return new HerokuApiClient({
    baseUrl, service: 'custom', signal: cliAbortSignal(), token: '', userAgent,
  })
}
