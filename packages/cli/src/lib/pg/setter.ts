import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import {addonResolver} from '../addons/resolve'
import host from './host'
import {essentialPlan} from './util'

export interface Setting {
  value: string | number
}

export type SettingKey =
  'auto_explain'
  | 'auto_explain.log_analyze'
  | 'auto_explain.log_buffers'
  | 'auto_explain.log_min_duration'
  | 'auto_explain.log_nested_statements'
  | 'auto_explain.log_triggers'
  | 'auto_explain.log_verbose'
  | 'log_connections'
  | 'log_lock_waits'
  | 'log_min_duration_statement'
  | 'log_statement'
  | 'track_functions'

export abstract class PGSettingsCommand extends Command {
  protected abstract settingKey: SettingKey

  protected abstract convertValue(val: unknown): unknown

  protected abstract explain(setting: Setting): string

  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  public async run(): Promise<void> {
    const {flags, args} = await this.parse()
    const {app} = flags
    const {value, database} = args

    const db = await addonResolver(this.heroku, app, database || '')

    if (essentialPlan(db)) ux.error('You can’t perform this operation on Essential-tier databases.')

    if (value) {
      const {body: settings} = await this.heroku.patch<Record<SettingKey, Setting>>(`/postgres/v0/databases/${db.id}/config`, {
        hostname: host(),
        body: {[this.settingKey]: this.convertValue(value)},
      })
      const setting = settings[this.settingKey]
      ux.log(`${this.settingKey.replace(/_/g, '-')} has been set to ${setting.value} for ${db.name}.`)
      ux.log(this.explain(setting))
    } else {
      const {body: settings} = await this.heroku.get<Record<SettingKey, Setting>>(`/postgres/v0/databases/${db.id}/config`, {hostname: host()})
      const setting = settings[this.settingKey]
      ux.log(`${this.settingKey.replace(/_/g, '-')} is set to ${setting.value} for ${db.name}.`)
      ux.log(this.explain(setting))
    }
  }
}

type BooleanAsString = true | false | 'on' | 'ON' | 'true' | 'TRUE' | 'off' | 'OFF' | 'false' | 'FALSE' | ''
export const booleanConverter = (value: BooleanAsString) => {
  switch (value) {
  case 'true':
  case 'TRUE':
  case 'ON':
  case 'on':
  case true:
    return true
  case 'false':
  case 'FALSE':
  case 'OFF':
  case 'off':
  case null:
  case '':
  case false:
    return false
  default:
    throw new TypeError('Invalid value. Valid options are: a boolean value')
  }
}

export const numericConverter = (value: string | number) => {
  const n = Number(value)
  if (!Number.isFinite(n)) {
    throw new TypeError('Invalid value. Valid options are: a numeric value')
  }

  return n
}
