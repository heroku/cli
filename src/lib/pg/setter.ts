import {Command, flags} from '@heroku-cli/command'
import {databaseSettingsExtensions, EssentialDatabaseNotSupportedError} from '@heroku/sdk/extensions/data'

import type {Setting, SettingKey} from './types.js'

import {createSDK} from '../sdk.js'

const ESSENTIAL_TIER_MESSAGE = 'You can\'t perform this operation on Essential-tier databases.'

/**
 * Runs a `data.databaseSettings` call, replacing the SDK's Essential-tier error
 * with the message `pg:settings` commands have always shown.
 */
export async function withEssentialTierMessage<T>(command: Command, call: () => Promise<T>): Promise<T> {
  try {
    return await call()
  } catch (error) {
    if (error instanceof EssentialDatabaseNotSupportedError) command.error(ESSENTIAL_TIER_MESSAGE)
    throw error
  }
}

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
    const {data} = createSDK(this.heroku, {extensions: [databaseSettingsExtensions]})
    const name = this.settingKey.replaceAll('_', '-')

    if (value) {
      const converted = this.convertValue(value) as never
      const {addon, setting} = await withEssentialTierMessage(this, () => data.databaseSettings.update(app, this.settingKey, converted, database))
      this.log(`${name} has been set to ${setting.value} for ${addon.name}.`)
      this.log(this.explain(setting as Setting<unknown>))
    } else {
      const {addon, setting} = await withEssentialTierMessage(this, () => data.databaseSettings.get(app, this.settingKey, database))
      this.log(`${name} is set to ${setting.value} for ${addon.name}.`)
      this.log(this.explain(setting as Setting<unknown>))
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
