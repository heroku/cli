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
 * `heroku-cli/<version> <platform>` — the User-Agent the legacy
 * `@heroku-cli/command` base class put on every request so Heroku's request
 * logs can attribute CLI traffic. SDK-backed commands bypass that base class,
 * so without this their requests lose the header (W-22735462). The version is
 * read from the CLI's own `package.json` — the same source oclif derives
 * `config.version` from — so no command/`config` reference is needed and the
 * helper stays usable from `src/lib/` call sites that only hold an `APIClient`.
 * `process.platform` stands in for `config.platform`; they match everywhere
 * except WSL, which oclif reports as `wsl` and this reports as `linux` — a
 * cosmetic request-log distinction, not a functional one.
 */
const {version: cliVersion} = JSON.parse(readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../package.json'), 'utf8')) as {version: string}
const userAgent = `heroku-cli/${cliVersion} ${process.platform}`

let abortController: AbortController | undefined
let onInterrupt: (() => void) | undefined

/**
 * Process-wide cancellation signal for SDK requests. A CLI invocation is a
 * single process, so one controller scoped to the process lifetime is the right
 * granularity — there is no narrower unit to cancel. It is created lazily on
 * first use (a command that never builds an SDK installs no handlers) and
 * shared across every `createSDK` call, so exactly one pair of signal listeners
 * is ever registered regardless of how many clients a command builds.
 *
 * `SIGINT`/`SIGTERM` abort it, so an interrupted command's in-flight SDK
 * requests reject with an `AbortError` instead of being orphaned by process
 * teardown. Listeners are registered with `process.once`, matching the existing
 * `log-displayer` convention: the first Ctrl-C aborts in-flight work (which
 * rejects and unwinds the command to exit); a second falls through to the
 * default/other handlers for a hard exit.
 */
function cliAbortSignal(): AbortSignal {
  if (!abortController) {
    abortController = new AbortController()
    onInterrupt = () => abortController!.abort()
    process.once('SIGINT', onInterrupt)
    process.once('SIGTERM', onInterrupt)
  }

  return abortController.signal
}

/**
 * @internal
 *
 * Test-only. Discards the memoized {@link cliAbortSignal} controller and removes
 * its `SIGINT`/`SIGTERM` listeners so the next `cliAbortSignal()` builds a fresh
 * one. A CLI process builds a single controller for its lifetime, so production
 * never needs this — but the unit suite runs thousands of "invocations" in one
 * process, and a test that emits `SIGINT`/`SIGTERM` (ps:forward, ps:socks,
 * mcp:start, log-displayer) would otherwise abort the shared signal for every
 * later real-SDK test. The shared `beforeEach` hook calls this so each test
 * starts with an un-aborted signal; removing the listeners also keeps them from
 * accumulating on `process` across the suite.
 */
export function resetCliAbortSignalForTesting(): void {
  if (onInterrupt) {
    process.removeListener('SIGINT', onInterrupt)
    process.removeListener('SIGTERM', onInterrupt)
    onInterrupt = undefined
  }

  abortController = undefined
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
 * Exported only so the wiring (token present, default `warn` sink and
 * `user-agent` header, `baseUrl` on the *platform* service and nowhere else,
 * caller overrides winning) is unit-testable without constructing a real
 * client. Prefer `createSDK` at call sites.
 *
 * `headers['user-agent']` is defaulted on the common `clientOptions` so every
 * service client identifies CLI traffic in Heroku's request logs. Headers merge
 * key-by-key rather than replacing wholesale, so a caller's own headers add to
 * (and a caller's `user-agent` still overrides) the default.
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
 * {@link cliAbortSignal}, so a `SIGINT`/`SIGTERM` aborts every in-flight SDK
 * request. heroku-fetch folds a client-level signal into *every* request, and
 * the SDK threads the resolved options through to the bare/custom clients its
 * extensions build internally (logplex/busl/exec streams, `ps` extended, …), so
 * one default here covers both generated route calls and extension methods —
 * this replaces the former `bindAbortSignal` proxy. Wiring one process-lifetime
 * signal into shared clients is sized for the short-lived CLI; a long-lived host
 * would scope the signal per unit of work instead. A caller can override it (or
 * drop it with `signal: undefined`) via `clientOptions`.
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
      warn: oclifWarn,
      ...opts.clientOptions,
      headers: {'user-agent': userAgent, ...opts.clientOptions?.headers},
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
    headers: {'user-agent': userAgent, ...opts.headers},
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
  return new HerokuApiClient({
    baseUrl, headers: {'user-agent': userAgent}, service: 'custom', token: '',
  })
}
