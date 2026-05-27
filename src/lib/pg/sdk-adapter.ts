import type {HerokuSDK} from '@heroku/sdk'

import type {BackupTransfer, PgDatabase, PgUpgradeStatus} from './types.js'
import type {NonAdvancedCredentialInfo} from '../data/types.js'

// Temporary adapter: the SDK's data client return types are incomplete in @heroku/types.
// These wrappers cast once so command files stay type-safe.
// Remove when heroku-types provides:
//   - DatabaseInfoResult.following
//   - DatabaseWaitStatusResult.error?, .step
//   - TransferListByAppResult as typed array
//   - PostgresDatabaseListCredentialsResult as typed array

type DataClient = HerokuSDK['data']

export async function getDatabaseInfo(data: DataClient, addonId: string): Promise<PgDatabase> {
  return data.database.info(addonId) as unknown as PgDatabase
}

export async function getUpgradeWaitStatus(data: DataClient, addonId: string): Promise<PgUpgradeStatus> {
  return data.database.upgradeWaitStatus(addonId) as unknown as PgUpgradeStatus
}

export async function listTransfersByApp(data: DataClient, appIdentity: string): Promise<BackupTransfer[]> {
  return data.transfer.listByApp(appIdentity) as unknown as BackupTransfer[]
}

export async function listCredentials(data: DataClient, addonId: string): Promise<NonAdvancedCredentialInfo[]> {
  return data.postgresDatabase.listCredentials(addonId) as unknown as NonAdvancedCredentialInfo[]
}

export async function runUpgrade(data: DataClient, addonId: string, body: {version?: string}): Promise<{message: string}> {
  const fn = data.database.runUpgrade as (name: string, body: {version?: string}) => Promise<unknown>
  return fn(addonId, body) as Promise<{message: string}>
}

export async function prepareUpgrade(data: DataClient, addonId: string, body: {version?: string}): Promise<{message: string}> {
  const fn = data.database.prepareUpgrade as (name: string, body: {version?: string}) => Promise<unknown>
  return fn(addonId, body) as Promise<{message: string}>
}

export async function dryRunUpgrade(data: DataClient, addonId: string, body: {version?: string}): Promise<{message: string}> {
  const fn = data.database.dryRunUpgrade as (name: string, body: {version?: string}) => Promise<unknown>
  return fn(addonId, body) as Promise<{message: string}>
}
