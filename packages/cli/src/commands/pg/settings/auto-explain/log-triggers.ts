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
    database: Args.string({description: 'add-on ID, config var name, provider ID, plan name or globally unique name of the database add-on. If omitted, we use DATABASE_URL.'}),
    value: Args.string({description: 'boolean indicating whether trigger execution statistics should be enabled.'}),
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
