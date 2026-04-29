import * as Heroku from '@heroku-cli/schema'

export type TransferSchedule = {
  hour: number,
  name: string,
  timezone: string,
  uuid: string,
}
export type PublicUrlResponse = {
  url: string,
}

type TransferTargetType = 'gof3r' | 'htcat' | 'pg_dump' | 'pg_restore'

export type BackupTransfer = {
  canceled_at: string
  created_at: string
  deleted_at: string
  finished_at: string
  from_name: string
  from_type: TransferTargetType
  from_url: string
  logs: Array<{
    created_at: string
    level: string
    message: string
  }>
  num: number
  num_keep: number
  options: {
    [k: string]: unknown
  }
  processed_bytes: number
  purged_at: string
  schedule?: {
    uuid: string
  }
  source_bytes: number
  started_at: string
  succeeded: boolean
  to_name: string
  to_type: TransferTargetType
  to_url: string
  updated_at: string
  uuid: string
  warnings: number
}

export type ExtendedAddon = Required<Heroku.AddOn> & {
  addon_service: Required<Heroku.AddOnService>,
  plan: Required<Heroku.Plan>,
}

type ServiceInfo
  = 'Behind By'
  | 'Connection Pooling'
  | 'Connections'
  | 'Continuous Protection'
  | 'Created'
  | 'Credentials'
  | 'Customer Encryption Key'
  | 'Data Encryption'
  | 'Data Size'
  | 'Enhanced Certificates'
  | 'Followers'
  | 'Following'
  | 'Fork/Follow'
  | 'Forked From'
  | 'Forks'
  | 'HA Status'
  | 'Infrastructure'
  | 'Maintenance'
  | 'Maintenance window'
  | 'Mutual TLS'
  | 'PG Version'
  | 'Plan'
  | 'Region'
  | 'Restricted Credentials'
  | 'Rollback'
  | 'Status'
  | 'Tables'
  | 'Upgradable Extensions'
  | 'Warning'

export type PgDatabaseService = {
  addon_id: string
  available_for_ingress: boolean
  created_at: string
  credentials: number
  current_transaction: number
  database_name: string
  database_password: string
  database_user: string
  following?: string
  forked_from: string
  formation?: {
    id: string
    primary: string
  }
  heroku_resource_id: string
  'hot_standby?'?: boolean
  info: Array<{
    name: ServiceInfo
    values: string[]
  }>
  is_in_recovery?: boolean
  leader: null | string
  metaas_source: string
  name: string
  num_bytes: number
  num_connections: number
  num_connections_waiting: number
  num_tables: number
  plan: {
    id: number
    name: string
  }
  port: number
  postgres_version: string
  resource_url: string
  'standalone?'?: boolean
  status_updated_at?: string
  target_transaction: null | string
  'waiting?': boolean
}

export type PgStatus = {
  'error?': boolean
  message: string
  'waiting?': boolean
}

export type PgUpgradeStatus = {
  'error?': boolean
  message: string
  step: string
  'waiting?': boolean
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

export type PgDatabase = PgDatabaseService & PgDatabaseTenant

export type PgUpgradeResponse = {
  message: string
}

export type PgUpgradeError = {
  body: {
    id: string,
    message: string,
  }
}

// Updated according to https://github.com/heroku/shogun/blob/main/lib/shogun/serializers/link_serializer.rb
export type Link = {
  created_at: string,
  id: string,
  name: string,
  remote: {
    attachment_name: string,
    name: string,
  },
  remote_name: string,
}
export type MaintenanceApiResponse = {
  message: string,
}
export type PgDatabaseConfig = {
  [key: string]: any;
  log_lock_waits: {
    value: boolean,
  },
}
export type SettingKey
  = 'auto_explain'
  | 'auto_explain.log_analyze'
  | 'auto_explain.log_buffers'
  | 'auto_explain.log_format'
  | 'auto_explain.log_min_duration'
  | 'auto_explain.log_nested_statements'
  | 'auto_explain.log_triggers'
  | 'auto_explain.log_verbose'
  | 'data_connector_details_logs'
  | 'log_connections'
  | 'log_lock_waits'
  | 'log_min_duration_statement'
  | 'log_min_error_statement'
  | 'log_statement'
  | 'pg_bouncer_default_pool_size'
  | 'pg_bouncer_max_db_conns'
  | 'pgbouncer_max_client_conn'
  | 'track_functions'
export type Setting<T> = {
  default: T
  desc: string
  value: T
  values: Record<string, string>
}
export type SettingsResponse = Record<SettingKey, Setting<unknown>>

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
