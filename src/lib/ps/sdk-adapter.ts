import type {Formation} from '@heroku/types/3.sdk'

import type {HerokuSDK} from '@heroku/sdk'

import type {AppProcessTier} from '../types/app-process-tier.js'
import type {DynoExtended} from '../types/dyno-extended.js'

// Temporary adapter: the SDK's types are incomplete in @heroku/types.
// These wrappers cast once so command files stay type-safe.
// Remove when heroku-types adds:
//   - FormationBatchUpdateOpts.updates[].size as string
//   - FormationBatchUpdateOpts.updates[].quantity as number | string
//   - App.process_tier
//   - Dyno.extended

type PlatformClient = HerokuSDK['platform']

export type ScaleUpdate = {
  quantity: string
  size?: string
  type: string
}

export async function scaleDynos(platform: PlatformClient, appIdentity: string, updates: ScaleUpdate[]): Promise<Formation[]> {
  const fn = platform.formation.batchUpdate as (
    appIdentity: string,
    body: {updates: ScaleUpdate[]},
  ) => Promise<Formation[]>
  return fn(appIdentity, {updates})
}

export async function getAppInfo(platform: PlatformClient, appIdentity: string): Promise<AppProcessTier> {
  return platform.app.info(appIdentity) as unknown as AppProcessTier
}

export async function listDynos(platform: PlatformClient, appIdentity: string): Promise<DynoExtended[]> {
  return platform.dyno.list(appIdentity) as unknown as DynoExtended[]
}
