import {APIClient} from '@heroku-cli/command'
import {AddOn} from '@heroku-cli/schema'

import type {CreatePoolParameters, PoolInfoResponse} from '../../../types/data.js'

export default async function createPool(
  dataApi: APIClient,
  addon: AddOn,
  parameters: CreatePoolParameters,
): Promise<PoolInfoResponse> {
  const {body: poolInfo} = await dataApi.post<PoolInfoResponse>(`/data/postgres/v1/${addon.id}/pools`, {
    body: parameters,
  })
  return poolInfo
}
