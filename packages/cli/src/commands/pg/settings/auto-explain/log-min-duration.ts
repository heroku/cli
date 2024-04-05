import {Args} from '@oclif/core'
import heredoc from 'tsheredoc'
import {PGSettingsCommand, type Setting, type SettingKey} from '../../../../lib/pg/setter'

export default class LogMinDuration extends PGSettingsCommand {
  static topic = 'pg'
  static description = heredoc(`
    Sets the minimum execution time in milliseconds for a statement's plan to be logged.
    Setting this value to 0 will log all queries. Setting this value to -1 will disable logging entirely.
  `)

  static args = {
    database: Args.string(),
    value: Args.integer(),
  }

  protected settingKey:SettingKey = 'auto_explain.log_min_duration'

  protected convertValue(val: number): number {
    return val
  }

  protected explain(setting: Setting) {
    if (setting.value === -1) {
      return 'Execution plan logging has been disabled.'
    }

    if (setting.value === 0) {
      return 'All queries will have their execution plans logged.'
    }

    return `All execution plans will be logged for queries taking up to ${setting.value} milliseconds or more.`
  }
}
