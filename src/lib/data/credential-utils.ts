import type {
  PostgresCredentialInfoResult as AdvancedCredentialInfo,
  PostgresInfoResult,
} from '@heroku/types/data'

type PoolInfo = PostgresInfoResult['pools'][number]

export function isLeaderPool(pool: PoolInfo): boolean {
  return pool.name === 'leader'
}

export function isOwnerCredential(cred: AdvancedCredentialInfo): boolean {
  return cred.type === 'owner'
}

export function sortByLeaderAndName(pools: PoolInfo[]) {
  return pools.sort((a, b) => {
    const isLeaderA = isLeaderPool(a)
    const isLeaderB = isLeaderPool(b)

    return isLeaderB < isLeaderA ? -1 : (isLeaderA < isLeaderB ? 1 : a.name.localeCompare(b.name))
  })
}

export function sortByOwnerAndName(credentials: AdvancedCredentialInfo[]) {
  return credentials.sort((a, b) => {
    const isOwnerA = isOwnerCredential(a)
    const isOwnerB = isOwnerCredential(b)

    return isOwnerB < isOwnerA ? -1 : (isOwnerA < isOwnerB ? 1 : a.name.localeCompare(b.name))
  })
}
