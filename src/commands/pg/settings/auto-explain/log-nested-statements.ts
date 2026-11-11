import type {DatabaseSetting} from '@heroku/sdk/extensions/data'

import {Args} from '@oclif/core'

import {type BooleanAsString, booleanConverter, PGSettingsCommand} from '../../../../lib/pg/setter.js'
import {nls} from '../../../../nls.js'

export default class LogNestedStatements extends PGSettingsCommand<'auto_explain.log_nested_statements'> {
  static args = {
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`}),
    value: Args.string({description: 'boolean indicating if execution plan logs include nested statements'}),
  }
  static description = "Nested statements are included in the execution plan's log."
  protected settingKey = 'auto_explain.log_nested_statements' as const

  protected convertValue(val: string): boolean {
    return booleanConverter(val as BooleanAsString)
  }

  protected explain(setting: DatabaseSetting<'auto_explain.log_nested_statements'>) {
    if (setting.value) {
      return 'Nested statements will be included in execution plan logs.'
    }

    return 'Only top-level execution plans will be included in logs.'
  }
}
