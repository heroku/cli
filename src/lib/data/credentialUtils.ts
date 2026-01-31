import type {CredentialInfo} from './types.js'

// NEW This is new. something similar exists in core: packages/cli/src/commands/pg/credentials.ts:61
// protected sortByDefaultAndName(credentials: CredentialInfo[]) {
//  return credentials.sort((a, b) => {
//    const isDefaultA = this.isDefaultCredential(a)
//    const isDefaultB = this.isDefaultCredential(b)
//
//    return isDefaultB < isDefaultA ? -1 : (isDefaultA < isDefaultB ? 1 : a.name.localeCompare(b.name))
//  })
// }
export function sortByOwnerAndName(credentials: CredentialInfo[]) {
  return credentials.sort((a, b) => {
    const isOwnerA = isOwnerCredential(a)
    const isOwnerB = isOwnerCredential(b)

    return isOwnerB < isOwnerA ? -1 : (isOwnerA < isOwnerB ? 1 : a.name.localeCompare(b.name))
  })
}

// NEW This is new because we are now sorting on type instead of the name: packages/cli/src/commands/pg/credentials.ts:70
// protected isDefaultCredential(cred: CredentialInfo): boolean {
//  return cred.name === 'default'
// }
export function isOwnerCredential(cred: CredentialInfo): boolean {
  return cred.type === 'owner'
}
