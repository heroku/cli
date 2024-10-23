import {Args} from '@oclif/core'
import heredoc from 'tsheredoc'
import {PGSettingsCommand} from '../../../lib/pg/setter'
import type {Setting, SettingKey} from '../../../lib/pg/types'
import {nls} from '../../../nls'

export default class LogMinDurationStatement extends PGSettingsCommand {
  static description = heredoc(`
    The duration of each completed statement will be logged if the statement completes after the time specified by VALUE.
    VALUE needs to specified as a whole number, in milliseconds.
    Setting log_min_duration_statement to zero prints all statement durations and -1 will disable logging statement durations.
  `)

  static args = {
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`}),
    value: Args.string({description: 'number in milliseconds to wait for the statement to complete before it\'s time is logged.'}),
  }

  protected settingKey:SettingKey = 'log_min_duration_statement'

  protected convertValue(val: unknown): number {
    return val as number
  }

  protected explain(setting: Setting<unknown>) {
    if (setting.value === -1) {
      return 'The duration of each completed statement will not be logged.'
    }

    if (setting.value === 0) {
      return 'The duration of each completed statement will be logged.'
    }

    return `The duration of each completed statement will be logged if the statement ran for at least ${setting.value} milliseconds.`
  }
}
