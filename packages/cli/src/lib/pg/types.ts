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

type TransferTargetType = 'pg_dump' | 'pg_restore' | 'gof3r' | 'htcat'

export type BackupTransfer = {
  uuid: string
  num: number
  from_name: string
  from_type: TransferTargetType
  from_url: string
  to_name: string
  to_type: TransferTargetType
  to_url: string
  options: {
    [k: string]: unknown
  }
  source_bytes: number
  processed_bytes: number
  succeeded: boolean
  warnings: number
  created_at: string
  started_at: string
  canceled_at: string
  updated_at: string
  finished_at: string
  deleted_at: string
  purged_at: string
  num_keep: number
  schedule?: {
    uuid: string
  }
  logs: Array<{
    created_at: string
    level: string
    message: string
  }>
}

export type AddOnWithRelatedData = Required<Heroku.AddOnAttachment['addon']> & {
  attachment_names?: string[],
  links?: Link[],
  plan: Required<Heroku.AddOn['plan']>
}

type ServiceInfo = 'Status' | 'Fork/Follow' | 'Rollback' | 'Created' | 'Region' | 'Data Encryption' | 'Continuous Protection'
  | 'Enhanced Certificates' | 'Upgradable Extensions' | 'Plan' | 'HA Status' | 'Behind By' | 'Data Size' | 'Tables' | 'PG Version'
  | 'Connections' | 'Connection Pooling' | 'Credentials' | 'Restricted Credentials' | 'Mutual TLS' | 'Customer Encryption Key'
  | 'Following' | 'Forked From' | 'Followers' | 'Forks' | 'Maintenance' | 'Maintenance window' | 'Infrastructure' | 'Warning'

export type PgDatabaseService = {
  addon_id: string
  name: string
  heroku_resource_id: string
  formation?: {
    id: string
    primary: string
  }
  metaas_source: string
  num_tables: number
  num_connections: number
  num_connections_waiting: number
  num_bytes: number
  postgres_version: string
  current_transaction: number
  is_in_recovery?: boolean
  plan: {
    id: number
    name: string
  }
  created_at: string
  'standalone?'?: boolean
  port: number
  database_name: string
  database_user: string
  'hot_standby?'?: boolean
  status_updated_at?: string
  following?: string
  forked_from: string
  target_transaction: string | null
  available_for_ingress: boolean
  resource_url: string
  database_password: string
  'waiting?': boolean
  credentials: number
  leader: string | null
  info: Array<{
    name: ServiceInfo
    values: string[]
  }>
}

type TenantInfo = 'Plan' | 'Status' | 'Connections' | 'PG Version' | 'Created' | 'Data Size' | 'Tables' | 'Fork/Follow'
  | 'Rollback' | 'Continuous Protection'

export type PgDatabaseTenant = {
  addon_id: string
  name: string
  plan: string
  created_at: string
  database_user: string
  database_name: string
  resource_url: string
  'waiting?': boolean
  num_bytes: number
  info: Array<{
    name: TenantInfo
    values: string[]
  }>
}

export type PgDatabase = PgDatabaseService | PgDatabaseTenant

export type AddOnWithPlan = Required<Heroku.AddOnAttachment['addon']> & { plan: Required<Heroku.AddOn['plan']> }
export type AddOnAttachmentWithConfigVarsAndPlan = Required<Heroku.AddOnAttachment> & {
  config_vars: Heroku.AddOn['config_vars']
  addon: AddOnWithRelatedData
}
export type Link = {
  attachment_name?: string,
  created_at: string,
  message: string,
  name: string,
  remote?: Link,
}
type CredentialState = 'enabling' | 'active' | 'revoking' | 'revoked' | 'archived'
export type Credential = {
  user: string
  password: string
  state: CredentialState
  connections?: number | null
}
type CredentialStoreState = 'provisioning' | 'wait_for_provisioning' | 'active' | 'rotating' | 'rotation_completed' | 'revoking' | 'archived'
export type CredentialInfo = {
  uuid: string
  name: string
  state: CredentialStoreState
  database: string
  host: string
  port: number
  credentials: Array<Credential>
}
export type CredentialsInfo = Array<CredentialInfo>
export type MaintenanceApiResponse = {
  message: string,
}
export type PgDatabaseConfig = {
  [key: string]: any;
  'log_lock_waits': {
    value: boolean,
  },
}
export type SettingKey = 'log_lock_waits' | 'log_connections' | 'log_min_duration_statement' | 'log_statement' | 'track_functions' |
  'pgbouncer_max_client_conn' | 'pg_bouncer_max_db_conns' | 'pg_bouncer_default_pool_size' | 'auto_explain' | 'auto_explain.log_min_duration' |
  'auto_explain.log_analyze' | 'auto_explain.log_triggers' | 'auto_explain.log_buffers' | 'auto_explain.log_verbose' |
  'auto_explain.log_nested_statements'
export type Setting<T> = {
  value: T
  values: Record<string, string>
  desc: string
  default: T
}
export type SettingsResponse = Record<SettingKey, Setting<unknown>>
