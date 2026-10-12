import {APIClient, vars} from '@heroku-cli/command'
import {HerokuSDK} from '@heroku/sdk'

import type {Completion, CompletionContext} from '../types/completion.js'

import {sdkClientOptions} from '../apps/client-options.js'

export const oneDay = 60 * 60 * 24

/**
 * Build a HerokuSDK platform client from a CompletionContext, or `undefined`
 * when the user is not authenticated.
 *
 * Completions run with only a `config` (no `this.heroku`), so we construct an
 * APIClient from the config and thread its CLI-resolved token/host into the SDK
 * exactly as commands do (see src/lib/apps/client-options.ts). Without this,
 * keychain- and HEROKU_HOST-authed users would hit auth failures mid-completion.
 *
 * `getAuth()` is non-interactive: it reads HEROKU_API_KEY / keychain / netrc and
 * returns no token when none is found — it never prompts (completions must never
 * block a shell on a login prompt). When no token resolves we return `undefined`
 * so callers offer nothing rather than firing an API call that can only 401.
 */
async function platformClient(ctx: CompletionContext) {
  const heroku = new APIClient(ctx.config)
  await heroku.getAuth()
  if (!heroku.auth) return
  return new HerokuSDK({clientOptions: sdkClientOptions(heroku)}).platform
}

export const AppCompletion: Completion = {
  cacheDuration: oneDay,
  // Scope the cache per API host so prod / staging / HEROKU_HOST never share an
  // app list. (Switching accounts on the same host reuses the list until the TTL
  // expires; `heroku autocomplete` regenerates on demand.)
  cacheKey: () => `app@${new URL(vars.apiUrl).host}`,
  async options(ctx: CompletionContext) {
    const platform = await platformClient(ctx)
    if (!platform) return []
    const apps = await platform.app.listOwnedAndCollaborated('~')
    return apps
      .map((a: {name?: string}) => a.name)
      .filter((name): name is string => typeof name === 'string')
      .sort()
  },
}

export const CompletionMapping: {[key: string]: Completion} = {
  app: AppCompletion,
}
