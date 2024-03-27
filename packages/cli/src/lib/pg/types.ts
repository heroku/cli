import * as Heroku from '@heroku-cli/schema'

export type TransferSchedule = {
  hour: number,
  name: string,
  timezone: string,
  uuid: string,
}
export type AddOnWithPlan = Required<Heroku.AddOnAttachment['addon']> & {plan: Required<Heroku.AddOn['plan']>}
export type AddOnAttachmentWithConfigVarsAndPlan = Heroku.AddOnAttachment & {
  config_vars: Heroku.AddOn['config_vars']
  addon: AddOnWithPlan
}
