import type {DatabaseSetting} from '@heroku/sdk/extensions/data'

import {Args} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import {PGSettingsCommand} from '../../../lib/pg/setter.js'
import {nls} from '../../../nls.js'

const heredoc = tsheredoc

export default class LogMinErrorStatement extends PGSettingsCommand<'log_min_error_statement'> {
  static args = {
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`}),
    value: Args.string({options: ['error', 'log', 'fatal', 'panic']}),
  }
  static description = heredoc(`
    log-min-error-statement controls the logging of SQL statements that cause an error at a specified severity level.
    This setting is useful to prevent logging SQL statements that might contain sensitive information.
    Use this setting to prevent logging SQL queries that contain sensitive information. Default is "error".
  `)
  protected settingKey = 'log_min_error_statement' as const

  protected convertValue(val: string): string {
    return val
  }

  protected explain(setting: DatabaseSetting<'log_min_error_statement'>) {
    return setting.values[setting.value]
  }
}
