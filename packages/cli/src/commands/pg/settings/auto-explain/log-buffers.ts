import {Args} from '@oclif/core'
import heredoc from 'tsheredoc'
import {BooleanAsString, PGSettingsCommand, booleanConverter} from '../../../../lib/pg/setter'
import {Setting, SettingKey} from '../../../../lib/pg/types'

export default class LogBuffersWaits extends PGSettingsCommand {
  static topic = 'pg'
  static description = heredoc(`
    Includes buffer usage statistics when execution plans are logged.
    This is equivalent to calling EXPLAIN BUFFERS and can only be used in conjunction with pg:settings:auto-explain:log-analyze turned on.
  `)

  static args = {
    database: Args.string({description: 'The config var exposed to the owning app containing the database configuration.'}),
    value: Args.string({description: 'Boolean indicating whether buffer statistics should be enabled.'}),
  }

  protected settingKey: SettingKey = 'auto_explain.log_buffers'

  protected convertValue(val: BooleanAsString): boolean {
    return booleanConverter(val)
  }

  protected explain(setting: Setting<boolean>) {
    if (setting.value) {
      return 'Buffer statistics have been enabled for auto_explain.'
    }

    return 'Buffer statistics have been disabled for auto_explain.'
  }
}
