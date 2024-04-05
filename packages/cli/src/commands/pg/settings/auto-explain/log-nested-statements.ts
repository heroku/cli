import {Args} from '@oclif/core'
import {PGSettingsCommand, type Setting, type SettingKey, booleanConverter} from '../../../../lib/pg/setter'

export default class LogBuffersWaits extends PGSettingsCommand {
  static description = "Nested statements are included in the execution plan's log."

  static args = {
    database: Args.string(),
    value: Args.string(),
  }

  protected settingKey: SettingKey = 'auto_explain.log_nested_statements'

  protected convertValue(val: boolean): boolean {
    return booleanConverter(val)
  }

  protected explain(setting: Setting) {
    if (setting.value) {
      return 'Nested statements will be included in execution plan logs.'
    }

    return 'Only top-level execution plans will be included in logs.'
  }
}
