import type {DatabaseSettingKey} from '@heroku/sdk/extensions/data'

import * as Heroku from '@heroku-cli/schema'

export type ExtendedAddon = Required<Heroku.AddOn> & {
  addon_service: Required<Heroku.AddOnService>,
  plan: Required<Heroku.Plan>,
}

type TenantInfoNames
  = 'Add-on'
  | 'Billing App'
  | 'Connections'
  | 'Continuous Protection'
  | 'Created'
  | 'Data Size'
  | 'Fork/Follow'
  | 'PG Version'
  | 'Plan'
  | 'Rollback'
  | 'Status'
  | 'Tables'

export type TenantInfo = {
  name: TenantInfoNames
  resolve_db_name?: boolean
  values: string[]
}

export type PgDatabaseTenant = {
  addon_id: string
  created_at: string
  database_name: string
  database_user: string
  following?: string
  info: Array<TenantInfo>
  name: string
  num_bytes: number
  plan: string
  resource_url: string
  'waiting?': boolean
}

export type SettingKey = DatabaseSettingKey

export type PGDiagnoseResponse = {
  app: string,
  checks: [
    PGDiagnoseCheck<ConnCountResult>,
    PGDiagnoseCheck<QueriesResult>,
    PGDiagnoseCheck<QueriesResult>,
    PGDiagnoseCheck<UnusedIndexesResult>,
    PGDiagnoseCheck<BloatResult>,
    PGDiagnoseCheck<HitRateResult>,
    PGDiagnoseCheck<BlockingResult>,
  ],
  created_at: string,
  database: string,
  id: string,
}

export type PGDiagnoseCheck<T extends PGDiagnoseResult = PGDiagnoseResult> = {
  name: string,
  results: T[]
  status: 'green' | 'red' | 'yellow',
}
export type PGDiagnoseResult
  = BloatResult
  | BlockingResult
  | ConnCountResult
  | HitRateResult
  | QueriesResult
  | UnusedIndexesResult
export type ConnCountResult = {
  count: number
}

export type QueriesResult = {
  duration: string,
  pid: number,
  query: string,
}

export type UnusedIndexesResult = {
  index: string,
  index_scan_pct: string,
  index_size: string,
  reason: string,
  scans_per_write: string,
  table_size: string,
}

export type BloatResult = {
  bloat: number,
  object: string,
  type: string,
  waste: string,
}

export type HitRateResult = {
  name: string,
  ratio: number,
}

export type BlockingResult = {
  blocked_duration: string,
  blocked_pid: number,
  blocked_statement: string,
  blocking_duration: string,
  blocking_pid: number,
  blocking_statement: string,
}

export type PGDiagnoseRequest = {
  app: string,
  burst_data_present?: boolean,
  burst_status?: string,
  database: string,
  metrics?: unknown[],
  plan: string,
  url: string,
}
