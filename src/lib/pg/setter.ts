import {Command, flags} from '@heroku-cli/command'
import {utils} from '@heroku/heroku-cli-util'
import {ux} from '@oclif/core/ux'

import type {Setting, SettingKey, SettingsResponse} from './types.js'

import {essentialPlan} from './util.js'

export abstract class PGSettingsCommand extends Command {
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }
  static topic = 'pg'
  protected abstract settingKey: SettingKey

  protected abstract convertValue(val: string): unknown

  protected abstract explain(setting: Setting<unknown>): string

  public async run(): Promise<void> {
    const {args, flags} = await this.parse()
    const {app} = flags
    const {database, value} = args as {database: string | undefined; value: string | undefined,}

    const dbResolver = new utils.pg.DatabaseResolver(this.heroku)
    const {addon: db} = await dbResolver.getAttachment(app, database)

    if (essentialPlan(db)) {
      ux.error('You can\'t perform this operation on Essential-tier databases.')
    }

    if (value) {
      const {body: settings} = await this.heroku.patch<SettingsResponse>(`/postgres/v0/databases/${db.id}/config`, {
        body: {[this.settingKey]: this.convertValue(value)},
        hostname: utils.pg.host(),
      })
      const setting = settings[this.settingKey]
      ux.stdout(`${this.settingKey.replaceAll('_', '-')} has been set to ${setting.value} for ${db.name}.`)
      ux.stdout(this.explain(setting))
    } else {
      const {body: settings} = await this.heroku.get<SettingsResponse>(`/postgres/v0/databases/${db.id}/config`, {hostname: utils.pg.host()})
      const setting = settings[this.settingKey]
      ux.stdout(`${this.settingKey.replaceAll('_', '-')} is set to ${setting.value} for ${db.name}.`)
      ux.stdout(this.explain(setting))
    }
  }
}

export type BooleanAsString = 'false' | 'FALSE' | 'off' | 'OFF' | 'on' | 'ON' | 'true' | 'TRUE'
export const booleanConverter = (value: BooleanAsString) => {
  switch (value) {
    case 'false':
    case 'FALSE':
    case null:
    case 'OFF':
    // falls through
    case 'off': {
      return false
    }

    case 'ON':
    case 'on':
    case 'true':
    case 'TRUE': {
      return true
    }

    default: {
      throw new TypeError('Invalid value. Valid options are: a boolean value')
    }
  }
}

export const numericConverter = (value: string) => {
  const n = Number(value)
  if (!Number.isFinite(n)) {
    throw new TypeError('Invalid value. Valid options are: a numeric value')
  }

  return n
}
