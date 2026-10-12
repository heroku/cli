import {APIClient, vars} from '@heroku-cli/command'
import {HerokuSDK} from '@heroku/sdk'
import {createHash} from 'node:crypto'

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
 * Resolve the CLI's auth token non-interactively, or `undefined` when the user
 * is not logged in.
 *
 * `getAuth()` reads HEROKU_API_KEY / keychain / netrc and returns no token when
 * none is found — it never prompts (completions must never block a shell on a
 * login prompt).
 */
async function resolveToken(ctx: CompletionContext): Promise<string | undefined> {
  const heroku = new APIClient(ctx.config)
  await heroku.getAuth()
  return heroku.auth
}

/**
 * Build a HerokuSDK platform client scoped for completion use, or `undefined`
 * when the user is not authenticated.
 *
 * Completions run with only a `config` (no `this.heroku`), so we construct an
 * APIClient from the config and thread its CLI-resolved token/host into the SDK
 * exactly as commands do (see src/lib/apps/client-options.ts). Without this,
 * keychain- and HEROKU_HOST-authed users would hit auth failures mid-completion.
 *
 * Two completion-only guarantees are layered on so a TAB can never hang the
 * shell: a short per-request `timeout`, and a `twoFactor` handler that rejects
 * rather than reading a 2FA code from stdin (the SDK's default handler prompts).
 */
async function platformClient(ctx: CompletionContext) {
  const heroku = new APIClient(ctx.config)
  await heroku.getAuth()
  if (!heroku.auth) return

  const sdk = new HerokuSDK({
    clientOptions: {
      ...sdkClientOptions(heroku),
      timeout: COMPLETION_TIMEOUT_MS,
      twoFactor: {onChallenge: () => Promise.reject(new Error('2FA is not available during shell completion'))},
    },
  })
  return sdk.platform
}

/**
 * Cache key for the app list. Scoped by both API host and a hash of the auth
 * token so that neither switching hosts (prod / staging / HEROKU_HOST) nor
 * switching accounts on the same host can serve another identity's app names.
 * The token is hashed, never stored.
 */
export function appCacheKey(host: string, token: string | undefined): string {
  const scope = token ? createHash('sha256').update(token).digest('hex').slice(0, 12) : 'anon'
  return `app@${host}#${scope}`
}

export const AppCompletion: Completion = {
  cacheDuration: oneDay,
  cacheKey: async ctx => appCacheKey(new URL(vars.apiUrl).host, await resolveToken(ctx)),
  async options(ctx: CompletionContext) {
    const platform = await platformClient(ctx)
    if (!platform) return []
    const apps = await platform
      .withOptions({signal: AbortSignal.timeout(COMPLETION_TIMEOUT_MS)})
      .app.listOwnedAndCollaborated('~')
    return apps
      .map((a: {name?: string}) => a.name)
      .filter((name): name is string => typeof name === 'string')
      .sort()
  },
}

export const completionsByFlag: {[flag: string]: Completion} = {
  app: AppCompletion,
}
