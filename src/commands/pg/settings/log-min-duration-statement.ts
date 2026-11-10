import type {DatabaseSetting} from '@heroku/sdk/extensions/data'

import {Args} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import {integerConverter, PGSettingsCommand} from '../../../lib/pg/setter.js'
import {nls} from '../../../nls.js'

const heredoc = tsheredoc

export default class LogMinDurationStatement extends PGSettingsCommand<'log_min_duration_statement'> {
  static args = {
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`}),
    value: Args.string({description: 'milliseconds to wait for a statement to complete before logging it'}),
  }
  static description = heredoc(`
    The duration of each completed statement will be logged if the statement completes after the time specified by VALUE.
    VALUE needs to specified as a whole number, in milliseconds.
    Setting log_min_duration_statement to zero prints all statement durations and -1 will disable logging statement durations.
  `)
  protected settingKey = 'log_min_duration_statement' as const

  protected convertValue(val: string): number {
    return integerConverter(val)
  }

  protected explain(setting: DatabaseSetting<'log_min_duration_statement'>) {
    if (setting.value === -1) {
      return 'The duration of each completed statement will not be logged.'
    }

    if (setting.value === 0) {
      return 'The duration of each completed statement will be logged.'
    }

    return `The duration of each completed statement will be logged if the statement ran for at least ${setting.value} milliseconds.`
  }
}
