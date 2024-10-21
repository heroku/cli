import {Args} from '@oclif/core'
import {type BooleanAsString, booleanConverter, PGSettingsCommand} from '../../../../lib/pg/setter'
import type {Setting, SettingKey} from '../../../../lib/pg/types'

export default class LogNestedStatements extends PGSettingsCommand {
  static description = "Nested statements are included in the execution plan's log."

  static args = {
    database: Args.string({description: 'The config var exposed to the owning app containing the database configuration.'}),
    value: Args.string({description: 'Boolean indicating whether nested statements will be included in execution plan logs.'}),
  }

  protected settingKey: SettingKey = 'auto_explain.log_nested_statements'

  protected convertValue(val: unknown): boolean {
    return booleanConverter(val as BooleanAsString)
  }

  protected explain(setting: Setting<unknown>) {
    if (setting.value) {
      return 'Nested statements will be included in execution plan logs.'
    }

    return 'Only top-level execution plans will be included in logs.'
  }
}
