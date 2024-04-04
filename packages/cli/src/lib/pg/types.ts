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
