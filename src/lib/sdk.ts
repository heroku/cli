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
const {version: cliVersion}: {version: string} = JSON.parse(readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../package.json'), 'utf8'))
const userAgent = {name: 'heroku-cli', version: cliVersion}

let abortController: AbortController | undefined
let onInterrupt: ((signal: NodeJS.Signals) => void) | undefined

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
 * teardown. But registering any signal listener suppresses Node's default
 * "terminate on signal", and aborting only reaches in-flight SDK requests — a
 * non-SDK wait (an interactive prompt, a `this.heroku` poll loop, the TLS attach
 * in `run`) would otherwise keep the event loop alive and swallow the Ctrl-C.
 * So the handler also guarantees termination: it aborts, drops its own one-shot
 * listeners, and — only when no *other* signal listener remains to exit — defers
 * a `process.exit` so the aborted requests reject and unwind first. When the
 * telemetry handler is registered (its persistent `process.on` listener, absent
 * on Windows / in CI / under `DISABLE_TELEMETRY` / in `bin/dev.js`), that owns
 * the exit instead, so we neither double-exit nor double-send telemetry. We
 * mirror the telemetry handler's exit code (`1`) so the interrupted exit code is
 * the same whether or not telemetry is on. A second Ctrl-C, with the one-shot
 * listeners already spent, falls through to whatever remains or Node's default.
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
    onInterrupt = (signal: NodeJS.Signals) => {
      controller.abort()
      // One-shot: drop our handler for both signals so a repeat falls through to
      // whatever else is registered, or to Node's default termination.
      if (onInterrupt) {
        process.removeListener('SIGINT', onInterrupt)
        process.removeListener('SIGTERM', onInterrupt)
      }

      // If no other listener is left to exit the process (telemetry off), restore
      // termination ourselves — deferred to the next tick so the microtask queue
      // drains and the aborted in-flight requests reject and unwind first.
      if (process.listenerCount(signal) === 0) {
        // eslint-disable-next-line n/no-process-exit, unicorn/no-process-exit -- aborting only cancels in-flight SDK requests; a non-SDK wait would keep the process alive and swallow the signal, so we must restore the default termination that our listener suppressed.
        setImmediate(() => process.exit(1))
      }
    }

    process.once('SIGINT', onInterrupt)
    process.once('SIGTERM', onInterrupt)
  }

  return abortController.signal
}

/**
 * @internal
 * Test-only: tear down the process-wide signal wiring and clear the memoized
 * controller so each test starts from a clean slate (no listeners leaked across
 * the run, next `cliAbortSignal` builds fresh). Not for production call sites.
 */
export function resetCliAbortSignal(): void {
  if (onInterrupt) {
    process.removeListener('SIGINT', onInterrupt)
    process.removeListener('SIGTERM', onInterrupt)
  }

  abortController = undefined
  onInterrupt = undefined
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
 * 401 recovery for SDK/heroku-fetch traffic: on an expired or invalid token the
 * CLI re-authenticates and retries instead of failing with a raw auth error.
 * Wired as heroku-fetch's `reauthorize` callback — the client fires it once when
 * a request 401s, awaits it, then retries the request exactly once, re-resolving
 * the {@link tokenFor} provider so the fresh token `login()` stored is picked up
 * (our provider reads `getAuthEntry()` per request). heroku-fetch coalesces
 * concurrent 401s, so a batch of in-flight requests sharing a stale token drives
 * a single `login()` rather than one prompt each.
 *
 * When `HEROKU_API_KEY` is set the token is not interactively recoverable, so we
 * surface the invalid-token error instead of prompting. Otherwise
 * `heroku.login()` runs — and `login()` itself refuses to prompt in a
 * non-interactive terminal (pointing the user at `HEROKU_API_KEY`), so the
 * CI/non-interactive guard needs no duplication here.
 *
 * We throw a bare `Error` for the `HEROKU_API_KEY` case: heroku-fetch attaches
 * the originating 401 as the error's `cause`, and that 401 carries only the
 * server `Response` (not the request), so the bearer token is not in the cause
 * chain — safe to surface, and keeping the 401 as cause preserves its status/id
 * for debugging.
 */
export const reauthorizeFor = (heroku: Pick<APIClient, 'login'>) => async (): Promise<void> => {
  if (process.env.HEROKU_API_KEY) {
    throw new Error('The token provided to HEROKU_API_KEY is invalid. Please double-check that you have the correct token, or run `heroku login` without HEROKU_API_KEY set.')
  }

  await heroku.login()
}

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
 * `reauthorize` is defaulted on `clientOptionsByService.platform` — the platform
 * front door — and nowhere else, so a 401 from an expired or invalid token
 * re-prompts for login and retries the request. We scope it to platform (not the
 * common `clientOptions`) because heroku-fetch's retry transparently replays the
 * request after re-auth, which is only safe for the platform's front-door auth:
 * a data-plane/proxied service can return a 401 *after* a non-idempotent write
 * has begun, and a blind replay would double it. v11 only recovered platform
 * traffic, so this also matches the behavior we're restoring. The opt-out still
 * reads from the common `clientOptions`: passing `reauthorize: undefined` there
 * disables the platform default (shell completion and `auth:whoami`/`auth:token`
 * do this, so a TAB never prompts and a `whoami` on a stale token still reports
 * "not logged in" instead of prompting). A single request can also opt out with
 * `reauthorize: false`, and a caller can still force a callback onto another
 * service via `clientOptionsByService.<service>.reauthorize`.
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
  // `reauthorize` is a platform-only default (see the doc comment), but a caller
  // disables it through the *common* `clientOptions` — `reauthorize: undefined` —
  // the same seam that disables every other default. Read that opt-out here, then
  // force `reauthorize` off the common options below so a caller-passed callback
  // can never reach a non-platform (data-plane/proxied) client, where a blind
  // retry after re-auth is unsafe. `'reauthorize' in …` distinguishes "disabled"
  // from "not mentioned" so an explicit `undefined` disables, while omitting the
  // key gets the default.
  const platformReauthorize = opts.clientOptions && 'reauthorize' in opts.clientOptions
    ? opts.clientOptions.reauthorize
    : reauthorizeFor(heroku)

  return {
    ...opts,
    clientOptions: {
      // These defaults are seeded before the `...opts.clientOptions` spread on
      // purpose: a caller's own value then wins — including an explicit
      // `undefined` to disable a default (e.g. `signal: undefined` to drop
      // cancellation). Seeding lazily instead (`?? cliAbortSignal()`) would
      // ignore an explicit `undefined` and refuse to disable.
      signal: cliAbortSignal(),
      token: tokenFor(heroku),
      userAgent,
      warn: oclifWarn,
      ...opts.clientOptions,
      // Forced last: reauthorize is platform-scoped only, so it never rides the
      // common options onto a non-platform client. The platform service
      // re-enables it (honoring the caller opt-out captured in platformReauthorize).
      reauthorize: undefined,
    },
    clientOptionsByService: {
      ...opts.clientOptionsByService,
      platform: {
        baseUrl: vars.apiUrl,
        reauthorize: platformReauthorize,
        ...opts.clientOptionsByService?.platform,
      },
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
 * and abort on `SIGINT`/`SIGTERM`. The 401→`login()`→retry `reauthorize` seam is
 * defaulted too, so a raw-client call recovers from an expired token like the
 * SDK path. Caller overrides win via the spread — e.g. the status command uses
 * {@link createUnauthenticatedClient} for an intentionally unauthenticated
 * third-party request, and shell completion passes `warn: undefined` /
 * `reauthorize: undefined` to stay silent and never prompt for login.
 */
export function apiClientOptions(
  heroku: Pick<APIClient, 'getAuthEntry' | 'login'>,
  opts: HerokuApiClientOptions = {},
): HerokuApiClientOptions {
  return {
    baseUrl: vars.apiUrl, reauthorize: reauthorizeFor(heroku), signal: cliAbortSignal(), token: tokenFor(heroku), userAgent, warn: oclifWarn, ...opts,
  }
}

/**
 * Construct a raw `HerokuApiClient` with the CLI-resolved token and platform
 * host applied. Use only where the typed SDK cannot serve the request (e.g. an
 * endpoint the generated routes don't expose); otherwise prefer `createSDK`.
 */
export function createApiClient(
  heroku: Pick<APIClient, 'getAuthEntry' | 'login'>,
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
