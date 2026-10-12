import {APIClient} from '@heroku-cli/command'
import {HerokuSDK} from '@heroku/sdk'

import type {Completion, CompletionContext} from '../types/completion.js'

import {sdkClientOptions} from '../apps/client-options.js'

export const oneDay = 60 * 60 * 24

/**
 * Build a HerokuSDK platform client from a CompletionContext.
 *
 * Completions run with only a `config` (no `this.heroku`), so we construct an
 * APIClient from the config and thread its CLI-resolved token/host into the SDK
 * exactly as commands do (see src/lib/apps/client-options.ts). Without this,
 * keychain- and HEROKU_HOST-authed users would hit auth failures mid-completion.
 */
async function platformClient(ctx: CompletionContext) {
  const heroku = new APIClient(ctx.config)
  // APIClient.auth is a sync getter over a lazily-resolved field; a fresh client
  // has no token until getAuth() reads keychain/netrc/HEROKU_API_KEY. Commands get
  // this for free via `this.heroku`, but completions construct their own client, so
  // we must resolve it here or sdkClientOptions threads `token: undefined`.
  await heroku.getAuth()
  return new HerokuSDK({clientOptions: sdkClientOptions(heroku)}).platform
}

export const AppCompletion: Completion = {
  cacheDuration: oneDay,
  async options(ctx: CompletionContext) {
    const platform = await platformClient(ctx)
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
