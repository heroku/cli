import {APIClient, vars} from '@heroku-cli/command'
import {HerokuApiClient} from '@heroku/heroku-fetch'
import {type HerokuApiClientOptions, HerokuSDK} from '@heroku/sdk'
import {execSync} from 'node:child_process'
import {createHash} from 'node:crypto'
import {readFile} from 'node:fs/promises'
import path from 'node:path'

import type {Completion, CompletionContext} from '../types/completion.js'

import {sdkClientOptions} from '../apps/client-options.js'

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
 * Client options for completion use: the CLI-resolved token and HEROKU_HOST-aware
 * `baseUrl` (see src/lib/apps/client-options.ts) plus the two completion-only
 * guarantees a TAB needs so it can never hang the shell — a short per-request
 * `timeout`, and a `twoFactor` handler that rejects rather than reading a 2FA
 * code from stdin (the default handler prompts). Shared by the SDK platform
 * client and the direct heroku-fetch client the stack completion uses.
 */
function completionClientOptions(heroku: APIClient): HerokuApiClientOptions {
  return {
    ...sdkClientOptions(heroku),
    timeout: COMPLETION_TIMEOUT_MS,
    twoFactor: {onChallenge: () => Promise.reject(new Error('2FA is not available during shell completion'))},
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

  const sdk = new HerokuSDK({clientOptions: completionClientOptions(heroku)})
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

  const client = new HerokuApiClient(completionClientOptions(heroku))
  const response = await client.get('/stacks', {signal: AbortSignal.timeout(COMPLETION_TIMEOUT_MS)})
  const stacks = (await response.json()) as ReadonlyArray<{name?: string}>
  return stacks
    .map(stack => stack.name)
    .filter((name): name is string => typeof name === 'string')
    .sort()
}

type PlatformClient = NonNullable<Awaited<ReturnType<typeof platformClient>>>

/**
 * Run one list call against the platform and return a sorted list of names.
 *
 * Shared by every completion so the auth/abort/empty-when-logged-out behavior
 * lives in exactly one place: resolve a client (nothing if unauthenticated),
 * apply the request deadline, then project to `name` strings. `transform` lets a
 * completion normalize names before sorting (e.g. dyno sizes are lower-cased).
 */
async function listNames(
  ctx: CompletionContext,
  fetch: (platform: PlatformClient) => Promise<ReadonlyArray<{name?: string}>>,
  transform: (names: string[]) => string[] = names => names,
): Promise<string[]> {
  const platform = await platformClient(ctx)
  if (!platform) return []

  const scoped = platform.withOptions({signal: AbortSignal.timeout(COMPLETION_TIMEOUT_MS)}) as PlatformClient
  const items = await fetch(scoped)
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
  app: AppCompletion,
  buildpack: BuildpackCompletion,
  dynosize: DynoSizeCompletion,
  enforcementaction: EnforcementActionCompletion,
  generation: GenerationCompletion,
  pgnetwork: PgNetworkCompletion,
  pipeline: PipelineCompletion,
  processtype: ProcessTypeCompletion,
  region: RegionCompletion,
  remote: RemoteCompletion,
  role: RoleCompletion,
  scope: ScopeCompletion,
  space: SpaceCompletion,
  stack: StackCompletion,
  stage: StageCompletion,
  team: TeamCompletion,
}
