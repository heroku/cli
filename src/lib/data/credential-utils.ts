import type {CredentialInfo, PoolInfoResponse} from './types.js'

export function isLeaderPool(pool: PoolInfoResponse): boolean {
  return pool.name === 'leader'
}

export function isOwnerCredential(cred: CredentialInfo): boolean {
  return cred.type === 'owner'
}

export function sortByLeaderAndName(pools: PoolInfoResponse[]) {
  return pools.sort((a, b) => {
    const isLeaderA = isLeaderPool(a)
    const isLeaderB = isLeaderPool(b)

    return isLeaderB < isLeaderA ? -1 : (isLeaderA < isLeaderB ? 1 : a.name.localeCompare(b.name))
  })
}

export function sortByOwnerAndName(credentials: CredentialInfo[]) {
  return credentials.sort((a, b) => {
    const isOwnerA = isOwnerCredential(a)
    const isOwnerB = isOwnerCredential(b)

    return isOwnerB < isOwnerA ? -1 : (isOwnerA < isOwnerB ? 1 : a.name.localeCompare(b.name))
  })
}
