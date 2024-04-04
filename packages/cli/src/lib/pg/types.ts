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
export type BackupTransfer = {
  created_at: string,
  canceled_at: string,
  finished_at: string,
  from_name: string,
  from_type: string,
  logs: Array<{
    created_at: string,
    message: string,
  }>,
  num: number,
  options: {
    pgbackups_name: string,
  },
  processed_bytes: number,
  schedule: { uuid: string },
  started_at: string,
  source_bytes: number,
  succeeded: boolean,
  to_name: string,
  to_type: string,
  to_url: string,
  updated_at: string,
  warnings: number,
}
export type AddOnWithRelatedData = Required<Heroku.AddOnAttachment['addon']> & {
  attachment_names?: string[],
  links?: Link[],
  plan: Required<Heroku.AddOn['plan']>
}
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
export type CredentialsInfo = {
  database: string
  host: string
  port: number
  credentials: {
    user: string
    password: string
    state: string
  }[]
}
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
  desc: string
  default: T
}
export type SettingsResponse = Record<SettingKey, Setting<unknown>>
