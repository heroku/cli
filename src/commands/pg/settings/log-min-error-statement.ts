import {Args} from '@oclif/core'
import tsheredoc from 'tsheredoc'
import {PGSettingsCommand} from '../../../lib/pg/setter.js'
import type {Setting, SettingKey} from '../../../lib/pg/types.js'
import {nls} from '../../../nls.js'

const heredoc = tsheredoc.default

export default class LogMinErrorStatement extends PGSettingsCommand {
  static description = heredoc(`
    log-min-error-statement controls the logging of SQL statements that cause an error at a specified severity level.
    This setting is useful to prevent logging SQL statements that might contain sensitive information.
    Use this setting to prevent logging SQL queries that contain sensitive information. Default is "error".
  `)

  static args = {
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`}),
    value: Args.string({options: ['error', 'log', 'fatal', 'panic']}),
  }

  protected settingKey: SettingKey = 'log_min_error_statement'

  protected convertValue(val: string): string {
    return val
  }

  protected explain(setting: Setting<string>) {
    return setting.values[setting.value]
  }
}
