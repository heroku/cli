import {Args} from '@oclif/core'
import heredoc from 'tsheredoc'
import {PGSettingsCommand, booleanConverter, BooleanAsString} from '../../../../lib/pg/setter'
import {SettingKey, Setting} from '../../../../lib/pg/types'

export default class LogTriggers extends PGSettingsCommand {
  static topic = 'pg'
  static description = heredoc(`
    Includes trigger execution statistics in execution plan logs.
    This parameter can only be used in conjunction with pg:settings:auto-explain:log-analyze turned on.
  `)

  static args = {
    database: Args.string(),
    value: Args.string(),
  }

  protected settingKey = 'auto_explain.log_triggers' as SettingKey

  protected convertValue(val: BooleanAsString): boolean {
    return booleanConverter(val)
  }

  protected explain(setting: Setting<boolean>) {
    if (setting.value) {
      return 'Trigger execution statistics have been enabled for auto-explain.'
    }

    return 'Trigger execution statistics have been disabled for auto-explain.'
  }
}
