import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import {addonResolver} from '../addons/resolve'
import host from './host'
import {essentialPlan} from './util'
import {FormationSetting, Setting, SettingsResponse} from './types'

export function boolean(value: string): boolean {
  switch (value) {
  case 'true': case 'TRUE': case 'ON': case 'on':
    return true
  case 'false': case 'FALSE': case 'OFF': case 'off':
    return false
  default:
    throw new TypeError('Invalid value. Valid options are: a boolean value')
  }
}

export abstract class PGSettingsCommand extends Command {
  protected abstract settingsName: FormationSetting
  protected abstract convertValue(val: string): unknown
  protected abstract explain(setting: Setting<unknown>): string

  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  public async run(): Promise<void> {
    const {flags, args} =  await this.parse()
    const {app} = flags
    const {value, database} = args as {value: string | undefined, database: string | undefined}

    const db = await addonResolver(this.heroku, app, database || '')

    if (essentialPlan(db)) ux.error('You can’t perform this operation on Essential-tier databases.')

    if (value) {
      const {body: settings} = await this.heroku.patch<SettingsResponse>(`/postgres/v0/databases/${db.id}/config`, {
        hostname: host(),
        body: {[this.settingsName]: this.convertValue(value)},
      })
      const setting = settings[this.settingsName]
      ux.log(`${this.settingsName.replace(/_/g, '-')} has been set to ${setting.value} for ${db.name}.`)
      ux.log(this.explain(setting))
    } else {
      const {body: settings} = await this.heroku.get<SettingsResponse>(`/postgres/v0/databases/${db.id}/config`, {hostname: host()})
      const setting = settings[this.settingsName]
      ux.log(`${this.settingsName.replace(/_/g, '-')} is set to ${setting.value} for ${db.name}.`)
      ux.log(this.explain(setting))
    }
  }
}
