import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import {addonResolver} from '../addons/resolve'
import host from './host'
import {essentialPlan} from './util'
import {SettingKey, Setting, SettingsResponse} from './types'

export abstract class PGSettingsCommand extends Command {
  protected abstract settingKey: SettingKey
  protected abstract convertValue(val: string): unknown
  protected abstract explain(setting: Setting<unknown>): string

  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  public async run(): Promise<void> {
    const {flags, args} = await this.parse()
    const {app} = flags
    const {value, database} = args as {value: string | undefined, database: string | undefined}

    const db = await addonResolver(this.heroku, app, database || 'DATABASE_URL')

    if (essentialPlan(db)) ux.error('You can’t perform this operation on Essential-tier databases.')

    if (value) {
      const {body: settings} = await this.heroku.patch<SettingsResponse>(`/postgres/v0/databases/${db.id}/config`, {
        hostname: host(),
        body: {[this.settingKey]: this.convertValue(value)},
      })
      const setting = settings[this.settingKey]
      ux.log(`${this.settingKey.replace(/_/g, '-')} has been set to ${setting.value} for ${db.name}.`)
      ux.log(this.explain(setting))
    } else {
      const {body: settings} = await this.heroku.get<SettingsResponse>(`/postgres/v0/databases/${db.id}/config`, {hostname: host()})
      const setting = settings[this.settingKey]
      ux.log(`${this.settingKey.replace(/_/g, '-')} is set to ${setting.value} for ${db.name}.`)
    }
  }
}

export type BooleanAsString = 'on' | 'ON' | 'true' | 'TRUE' | 'off' | 'OFF' | 'false' | 'FALSE'
export const booleanConverter = (value: BooleanAsString) => {
  switch (value) {
  case 'true':
  case 'TRUE':
  case 'ON':
  case 'on':
    return true
  case 'false':
  case 'FALSE':
  case 'OFF':
  case 'off':
  case null:
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
