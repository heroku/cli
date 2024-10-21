import {Args} from '@oclif/core'
import heredoc from 'tsheredoc'
import {PGSettingsCommand, numericConverter} from '../../../../lib/pg/setter'
import {Setting, SettingKey} from '../../../../lib/pg/types'

export default class LogMinDuration extends PGSettingsCommand {
  static topic = 'pg'
  static description = heredoc(`
    Sets the minimum execution time in milliseconds for a statement's plan to be logged.
    Setting this value to 0 will log all queries. Setting this value to -1 will disable logging entirely.
  `)

  static args = {
    database: Args.string({description: 'The config var exposed to the owning app containing the database configuration.'}),
    value: Args.string({description: 'Number indicating the min duration in milliseconds for queries before execution plans will be logged. A value of -1 disables it. A value of 0 means all queries will have their execution plans logged.'}),
  }

  protected settingKey: SettingKey = 'auto_explain.log_min_duration'

  protected convertValue(val: string): number {
    return numericConverter(val)
  }

  protected explain(setting: Setting<number>) {
    if (setting.value === -1) {
      return 'Execution plan logging has been disabled.'
    }

    if (setting.value === 0) {
      return 'All queries will have their execution plans logged.'
    }

    return `All execution plans will be logged for queries taking up to ${setting.value} milliseconds or more.`
  }
}
