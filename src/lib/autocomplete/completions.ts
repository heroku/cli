import type {HerokuApiClientOptions} from '@heroku/sdk'

import {APIClient, vars} from '@heroku-cli/command'
import {execSync} from 'node:child_process'
import {createHash} from 'node:crypto'
import {readFile} from 'node:fs/promises'
import path from 'node:path'

import type {Completion, CompletionContext} from '../types/completion.js'

import {createApiClient, createSDK} from '../sdk.js'

export const oneDay = 60 * 60 * 24

/**
 * Hard upper bound (ms) on any single completion's API work. A TAB must never
 * freeze the shell: the SDK otherwise defaults to a 30s-per-attempt timeout with
 * retries, and a stale network could block for well over a minute. We abort the
 * request after this deadline and offer nothing instead.
 */
const COMPLETION_TIMEOUT_MS = 2500

/**
 * A single authenticated APIClient for this process, memoized.
 *
 * Each `autocomplete:__suggest` invocation completes exactly one flag, calling
 * both `cacheKey` (which needs the token) and `options` (which needs an authed
 * client) once each. Resolving auth separately in each read HEROKU_API_KEY /
 * keychain / netrc twice per TAB — two `security` touches on macOS. Resolve it
 * once and share. `getAuth()` never prompts: it returns no token when none is
 * found, so an unauthenticated user yields a client with `auth === undefined`
 * rather than a blocked shell.
 */
let authedClientPromise: Promise<APIClient> | undefined

function authedClient(ctx: CompletionContext): Promise<APIClient> {
  if (!authedClientPromise) {
    const heroku = new APIClient(ctx.config)
    authedClientPromise = heroku.getAuth().then(() => heroku)
  }

  return authedClientPromise
}

/**
 * Resolve the CLI's auth token non-interactively, or `undefined` when the user
 * is not logged in.
 */
async function resolveToken(ctx: CompletionContext): Promise<string | undefined> {
  const heroku = await authedClient(ctx)
  return heroku.auth
}

/**
 * Completion-only client options: the guarantees a TAB needs so it can never
 * disrupt the shell — a short per-request `timeout`, a `twoFactor` handler that
 * rejects rather than reading a 2FA code from stdin (the default handler
 * prompts), and `warn: undefined` to opt out of the default API-warning sink so
 * no `Warning:` ever lands on stderr mid-completion and corrupts the prompt. The
 * CLI-resolved token and HEROKU_HOST-aware `baseUrl` come from `createSDK` /
 * `createApiClient`. Shared by the SDK platform client and the direct
 * heroku-fetch client the stack completion uses.
 */
// @internal — exported only so the completion-silence guarantees (notably
// opting out of the default `warn` sink) are unit-testable.
export function completionClientOptions(): HerokuApiClientOptions {
  return {
    timeout: COMPLETION_TIMEOUT_MS,
    twoFactor: {onChallenge: () => Promise.reject(new Error('2FA is not available during shell completion'))},
    warn: undefined,
  }
}

/**
 * Build a HerokuSDK platform client scoped for completion use, or `undefined`
 * when the user is not authenticated.
 *
 * Completions run with only a `config` (no `this.heroku`), so we construct an
 * APIClient from the config and thread its CLI-resolved token/host into the SDK
 * exactly as commands do. Without this, keychain- and HEROKU_HOST-authed users
 * would hit auth failures mid-completion.
 */
async function platformClient(ctx: CompletionContext) {
  const heroku = await authedClient(ctx)
  if (!heroku.auth) return

  const sdk = createSDK(heroku, {clientOptions: completionClientOptions()})
  return sdk.platform
}

/**
 * List all stack names via a direct `GET /stacks`.
 *
 * The SDK's `platform.stack.listGet()` cannot list stacks account-wide: a
 * `@heroku/types` generator collision (two "List" links collapsing onto one
 * method key) leaves its only runtime route app-scoped
 * (`GET /apps/{app}/available-stacks`), so a no-arg call throws "Missing path
 * parameter". Until a regenerated `@heroku/types` exposes a no-arg stacks list
 * (fixed upstream in typescript-api-schema's patch-hyperschema.ts), we bypass
 * the SDK and hit the real collection endpoint through heroku-fetch directly.
 * Auth/timeout/2FA handling matches platformClient so behavior is identical to
 * the other completions (nothing offered when logged out; aborts on timeout).
 */
async function stackNames(ctx: CompletionContext): Promise<string[]> {
  const heroku = await authedClient(ctx)
  if (!heroku.auth) return []

  const client = createApiClient(heroku, completionClientOptions())
  const response = await client.get('/stacks', {signal: AbortSignal.timeout(COMPLETION_TIMEOUT_MS)})
  const stacks = (await response.json()) as ReadonlyArray<{name?: string}>
  return stacks
    .map(stack => stack.name)
    .filter((name): name is string => typeof name === 'string')
    .sort()
}

type PlatformClient = NonNullable<Awaited<ReturnType<typeof platformClient>>>

/**
 * Run one call against a request-deadline-scoped platform client, or return
 * `undefined` when the user is not authenticated.
 *
 * The single place the auth/abort/empty-when-logged-out behavior lives: resolve
 * a client (nothing if unauthenticated), apply the per-request completion
 * deadline, then hand the scoped client to `fetch`. Projection/sorting is left
 * to the caller so completions whose resource is not a `{name}` list (releases
 * are keyed by `version`, config vars are an object) can shape their own values.
 */
async function withPlatform<T>(
  ctx: CompletionContext,
  fetch: (platform: PlatformClient) => Promise<T>,
): Promise<T | undefined> {
  const platform = await platformClient(ctx)
  if (!platform) return undefined

  const scoped = platform.withOptions({signal: AbortSignal.timeout(COMPLETION_TIMEOUT_MS)}) as PlatformClient
  return fetch(scoped)
}

/**
 * Run one list call against the platform and return a sorted list of names.
 *
 * Thin wrapper over `withPlatform` for the common case: project each item to its
 * `name` string, then sort. `transform` lets a completion normalize names before
 * sorting (e.g. dyno sizes are lower-cased).
 */
async function listNames(
  ctx: CompletionContext,
  fetch: (platform: PlatformClient) => Promise<ReadonlyArray<{name?: string}>>,
  transform: (names: string[]) => string[] = names => names,
): Promise<string[]> {
  const items = await withPlatform(ctx, fetch)
  if (!items) return []

  const names = items.map(item => item.name).filter((name): name is string => typeof name === 'string')
  return transform(names).sort()
}

function tokenScope(token: string | undefined): string {
  return token ? createHash('sha256').update(token).digest('hex').slice(0, 12) : 'anon'
}

/**
 * Cache key for an account-specific resource (apps, teams, pipelines, spaces).
 * Scoped by both API host and a hash of the auth token so neither switching
 * hosts (prod / staging / HEROKU_HOST) nor switching accounts on the same host
 * can serve another identity's values. The token is hashed, never stored.
 */
export function accountCacheKey(kind: string, host: string, token: string | undefined): string {
  return `${kind}@${host}#${tokenScope(token)}`
}

/**
 * Cache key for a host-global resource (regions, stacks). These are identical
 * for every account on a host, so the key omits the token — all accounts share
 * one cached list — while still partitioning prod from staging. (Dyno sizes are
 * NOT host-global: the available set varies by account entitlement, so they use
 * accountCacheKey.)
 */
export function hostCacheKey(kind: string, host: string): string {
  return `${kind}@${host}`
}

const apiHost = (): string => new URL(vars.apiUrl).host

export const AppCompletion: Completion = {
  cacheDuration: oneDay,
  cacheKey: async ctx => accountCacheKey('app', apiHost(), await resolveToken(ctx)),
  options: ctx => listNames(ctx, platform => platform.app.listOwnedAndCollaborated('~')),
}

export const TeamCompletion: Completion = {
  cacheDuration: oneDay,
  cacheKey: async ctx => accountCacheKey('team', apiHost(), await resolveToken(ctx)),
  options: ctx => listNames(ctx, platform => platform.team.list()),
}

export const PipelineCompletion: Completion = {
  cacheDuration: oneDay,
  cacheKey: async ctx => accountCacheKey('pipeline', apiHost(), await resolveToken(ctx)),
  options: ctx => listNames(ctx, platform => platform.pipeline.list()),
}

export const SpaceCompletion: Completion = {
  cacheDuration: oneDay,
  cacheKey: async ctx => accountCacheKey('space', apiHost(), await resolveToken(ctx)),
  options: ctx => listNames(ctx, platform => platform.space.list()),
}

export const RegionCompletion: Completion = {
  cacheDuration: oneDay * 7,
  cacheKey: () => hostCacheKey('region', apiHost()),
  options: ctx => listNames(ctx, platform => platform.region.list()),
}

export const StackCompletion: Completion = {
  cacheDuration: oneDay,
  cacheKey: () => hostCacheKey('stack', apiHost()),
  options: ctx => stackNames(ctx),
}

export const DynoSizeCompletion: Completion = {
  cacheDuration: oneDay * 90,
  cacheKey: async ctx => accountCacheKey('dynosize', apiHost(), await resolveToken(ctx)),
  options: ctx => listNames(ctx, platform => platform.dynoSize.list(), names => names.map(name => name.toLowerCase())),
}

// App-scoped completions. Unlike the account-wide ones above, these list the
// resources of ONE app — the app the generated script extracted from the line's
// `--app` and threaded in as `ctx.app`. With no app on the line there is nothing
// to scope to, so they offer nothing rather than erroring.

/**
 * Dyno names for the app on the command line (e.g. `web.1`, `worker.2`), used by
 * the `--dyno` / `--dyno-name` flags of logs and the ps:* commands. Cached only
 * briefly and per app: dynos come and go with scaling, restarts, and crashes, so
 * a long TTL would routinely offer names that no longer exist.
 */
export const DynoCompletion: Completion = {
  cacheDuration: 60,
  cacheKey: async ctx => accountCacheKey(`dyno:${ctx.app ?? ''}`, apiHost(), await resolveToken(ctx)),
  options: ctx => (ctx.app ? listNames(ctx, platform => platform.dyno.list(ctx.app!)) : Promise.resolve([])),
}

/**
 * Add-on and attachment names (e.g. `postgresql-cubic-12345`), used by the
 * add-on positional args of `addons:info`, `addons:destroy`, `addons:rename`,
 * the `data:maintenances:*` commands, etc. When the line carries an `--app` we
 * list just that app's add-ons; otherwise — add-on names are globally unique, so
 * commands like `addons:rename` take one with no `--app` — we list the account's
 * add-ons across all apps. Moderately cached (and partitioned by app): add-ons
 * change only on provision/attach/detach.
 */
export const AddonCompletion: Completion = {
  cacheDuration: 60 * 10,
  cacheKey: async ctx => accountCacheKey(`addon:${ctx.app ?? ''}`, apiHost(), await resolveToken(ctx)),
  options: ctx =>
    listNames(ctx, platform => (ctx.app ? platform.addOn.listByApp(ctx.app) : platform.addOn.list())),
}

/**
 * The newest release versions for the app on the command line, as `vNNN`
 * (e.g. `v4123`), used by the release positional args of `releases:info`,
 * `releases:output`, and `releases:rollback`. The API lists releases ascending
 * and the SDK auto-paginates, so we sort newest-first and cap the menu: a long-
 * lived app can have thousands of releases, and only the most recent are useful
 * to complete (an over-large fetch simply aborts on the deadline → nothing).
 * Short TTL: a new release lands on every deploy and config change.
 */
const MAX_RELEASE_COMPLETIONS = 100
export const ReleaseCompletion: Completion = {
  cacheDuration: 60,
  cacheKey: async ctx => accountCacheKey(`release:${ctx.app ?? ''}`, apiHost(), await resolveToken(ctx)),
  async options(ctx) {
    if (!ctx.app) return []
    const releases = await withPlatform(ctx, platform => platform.release.list(ctx.app!))
    if (!releases) return []
    return releases
      .map(release => release.version)
      .filter((version): version is number => typeof version === 'number')
      .sort((a, b) => b - a)
      .slice(0, MAX_RELEASE_COMPLETIONS)
      .map(version => `v${version}`)
  },
}

/**
 * Config var names for the app on the command line (e.g. `DATABASE_URL`), used
 * by the key positional of `config:get` and `config:edit`. The API returns the
 * vars as an object keyed by name, so we complete `Object.keys`. Short TTL:
 * config vars change under the user's hands.
 */
export const ConfigVarCompletion: Completion = {
  cacheDuration: 60,
  cacheKey: async ctx => accountCacheKey(`configvar:${ctx.app ?? ''}`, apiHost(), await resolveToken(ctx)),
  async options(ctx) {
    if (!ctx.app) return []
    const config = await withPlatform(ctx, platform => platform.configVar.infoForApp(ctx.app!))
    return config ? Object.keys(config).sort() : []
  },
}

// Static and local-context completions. These take no auth and make no API call —
// a fixed value set, or a read of local state (the cwd Procfile, git remotes) at
// completion time — so they carry no cache key (`skipCache`) and ignore the context.
// They are defined here, standalone, so this catalog can be the single source of
// truth as these completions are consolidated out of @heroku-cli/command.

export const BuildpackCompletion: Completion = {
  options: () => [
    'heroku/ruby',
    'heroku/nodejs',
    'heroku/clojure',
    'heroku/python',
    'heroku/java',
    'heroku/gradle',
    'heroku/scala',
    'heroku/php',
    'heroku/go',
  ],
  skipCache: true,
}

export const RoleCompletion: Completion = {
  options: () => ['admin', 'collaborator', 'member', 'owner'],
  skipCache: true,
}

export const ScopeCompletion: Completion = {
  options: () => ['global', 'identity', 'read', 'write', 'read-protected', 'write-protected'],
  skipCache: true,
}

export const StageCompletion: Completion = {
  options: () => ['test', 'review', 'development', 'staging', 'production'],
  skipCache: true,
}

/**
 * Process (dyno) types declared in the Procfile in the current directory. Reads
 * the local Procfile at completion time — no API, no auth — and returns the type
 * names (the leading word of each non-blank line). Empty when there is no Procfile
 * or it declares no types.
 */
export const ProcessTypeCompletion: Completion = {
  async options() {
    try {
      const procfile = await readFile(path.join(process.cwd(), 'Procfile'), 'utf8')
      return procfile
        .split('\n')
        .flatMap(line => line.match(/^([\w-]+)/)?.[1] ?? [])
    } catch {
      return []
    }
  },
  skipCache: true,
}

/**
 * Git remote names in the current repository. Shells out to `git remote` at
 * completion time — no API, no auth. Empty outside a git repo or when git is
 * absent. The command is a fixed string with no interpolated input.
 */
export const RemoteCompletion: Completion = {
  options() {
    try {
      return execSync('git remote', {encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore']})
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean)
    } catch {
      return []
    }
  },
  skipCache: true,
}

// Static enum completions for `options: [...]` flags that declared no completion.
// Each mirrors the exact `options` array of a single visible flag, so wiring it
// globally by the flag's long name is safe (no other command reuses the name with
// a different value set). Kept in sync with the source flag noted on each.

/** `--network` on `data:pg:create` (options: ['private', 'shield']). */
export const PgNetworkCompletion: Completion = {
  options: () => ['private', 'shield'],
  skipCache: true,
}

/** `--generation` on `spaces:create` (options: ['cedar', 'fir']). */
export const GenerationCompletion: Completion = {
  options: () => ['cedar', 'fir'],
  skipCache: true,
}

/** `--enforcement-action` on `data:pg:quotas:update` (options: ['notify', 'restrict', 'none']). */
export const EnforcementActionCompletion: Completion = {
  options: () => ['notify', 'restrict', 'none'],
  skipCache: true,
}

/**
 * Implemented completions, keyed by a stable completion id. The generated shell
 * scripts pass this id back verbatim via `autocomplete:__suggest --flag <id>`,
 * and the id is also what the injection binds a command's flag to (see
 * src/lib/autocomplete/inject.ts). The id is deliberately decoupled from a
 * flag's long name — e.g. the `--size` flag binds to the `dynosize` id.
 */
export const completionCatalog: {[id: string]: Completion} = {
  addon: AddonCompletion,
  app: AppCompletion,
  buildpack: BuildpackCompletion,
  configvar: ConfigVarCompletion,
  dyno: DynoCompletion,
  dynosize: DynoSizeCompletion,
  enforcementaction: EnforcementActionCompletion,
  generation: GenerationCompletion,
  pgnetwork: PgNetworkCompletion,
  pipeline: PipelineCompletion,
  processtype: ProcessTypeCompletion,
  region: RegionCompletion,
  release: ReleaseCompletion,
  remote: RemoteCompletion,
  role: RoleCompletion,
  scope: ScopeCompletion,
  space: SpaceCompletion,
  stack: StackCompletion,
  stage: StageCompletion,
  team: TeamCompletion,
}
