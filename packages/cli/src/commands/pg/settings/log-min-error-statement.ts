import {Args} from '@oclif/core'
import heredoc from 'tsheredoc'
import {PGSettingsCommand} from '../../../lib/pg/setter'
import type {Setting, SettingKey} from '../../../lib/pg/types'

export default class LogMinErrorStatement extends PGSettingsCommand {
  static description = heredoc(`
    log-min-error-statement controls the logging of SQL statements that cause an error at a specified severity level.
    This setting is useful to prevent logging SQL queries that might contain sensitive information.
    Use this setting to prevent logging SQL queries that contain sensitive information. Default is "error".
  `)

  static args = {
    database: Args.string(),
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
