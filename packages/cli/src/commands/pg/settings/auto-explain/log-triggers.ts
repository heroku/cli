import {Args} from '@oclif/core'
import heredoc from 'tsheredoc'
import {PGSettingsCommand, booleanConverter, BooleanAsString} from '../../../../lib/pg/setter'
import {SettingKey, Setting} from '../../../../lib/pg/types'
import {nls} from '../../../../nls'

export default class LogTriggers extends PGSettingsCommand {
  static topic = 'pg'
  static description = heredoc(`
    Includes trigger execution statistics in execution plan logs.
    This parameter can only be used in conjunction with pg:settings:auto-explain:log-analyze turned on.
  `)

  static args = {
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`}),
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
