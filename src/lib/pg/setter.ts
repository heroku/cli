import {Command, flags} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {
  AdvancedDatabaseNotSupportedError,
  type DatabaseSetting,
  databaseSettingsExtensions,
  EssentialDatabaseNotSupportedError,
} from '@heroku/sdk/extensions/data'

import type {SettingKey} from './types.js'

import {createSDK} from '../sdk.js'

const ESSENTIAL_TIER_MESSAGE = 'You can\'t perform this operation on Essential-tier databases.'

/**
 * Runs a `data.databaseSettings` call, replacing the SDK's tier errors with
 * CLI messages: the Essential-tier message `pg:settings` commands have always
 * shown, and an Advanced-tier message that points to `data:pg:settings`, the
 * command for Advanced-tier settings.
 */
export async function withSettingsTierMessages<T>(command: Command, app: string, call: () => Promise<T>): Promise<T> {
  try {
    return await call()
  } catch (error) {
    if (error instanceof EssentialDatabaseNotSupportedError) command.error(ESSENTIAL_TIER_MESSAGE)
    if (error instanceof AdvancedDatabaseNotSupportedError) {
      command.error(`You can't perform this operation on Advanced-tier databases.\nUse ${color.code(`heroku data:pg:settings ${error.addon.name} --app ${app}`)} to view or change its settings.`)
    }

    throw error
  }
}

/**
 * Base class for the `pg:settings:<setting>` commands. `K` ties each
 * subclass's `convertValue` and `explain` to the SDK's types for its setting.
 */
export abstract class PGSettingsCommand<K extends SettingKey = SettingKey> extends Command {
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }
  static topic = 'pg'
  protected abstract settingKey: K

  protected abstract convertValue(val: string): DatabaseSetting<K>['value']

  protected abstract explain(setting: DatabaseSetting<K>): string

  public async run(): Promise<void> {
    const {args, flags} = await this.parse()
    const {app} = flags
    const {database, value} = args as {database: string | undefined; value: string | undefined,}
    const {data} = createSDK(this.heroku, {extensions: [databaseSettingsExtensions]})
    const name = this.settingKey.replaceAll('_', '-')

    if (value) {
      const converted = this.convertValue(value)
      const {addon, setting} = await withSettingsTierMessages(this, app, () => data.databaseSettings.update(app, this.settingKey, converted, database))
      this.log(`${name} has been set to ${setting.value} for ${addon.name}.`)
      this.log(this.explain(setting))
    } else {
      const {addon, setting} = await withSettingsTierMessages(this, app, () => data.databaseSettings.get(app, this.settingKey, database))
      this.log(`${name} is set to ${setting.value} for ${addon.name}.`)
      this.log(this.explain(setting))
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

/** Accepts a whole number, including 0 and negative values such as -1. */
export const integerConverter = (value: string) => {
  if (!/^-?\d+$/.test(value)) {
    throw new TypeError('Invalid value. Valid options are: a whole number')
  }

  return Number(value)
}

export const numericConverter = (value: string) => {
  const n = Number(value)
  if (!Number.isFinite(n)) {
    throw new TypeError('Invalid value. Valid options are: a numeric value')
  }

  return n
}
