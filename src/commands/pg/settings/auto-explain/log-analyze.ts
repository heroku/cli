import {Args} from '@oclif/core'
import tsheredoc from 'tsheredoc'
import {PGSettingsCommand, booleanConverter, BooleanAsString} from '../../../../lib/pg/setter.js'
import {SettingKey, Setting} from '../../../../lib/pg/types.js'
import {nls} from '../../../../nls.js'

const heredoc = tsheredoc.default

export default class LogAnalyze extends PGSettingsCommand {
  static topic = 'pg'
  static description = heredoc(`
    Shows actual run times on the execution plan.
    This is equivalent to calling EXPLAIN ANALYZE.

    WARNING: EXPLAIN ANALYZE will be run on ALL queries, not just logged queries. This can cause significant performance impacts to your database and should be used with caution.
  `)

  static args = {
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`}),
    value: Args.string({description: 'boolean indicating if execution plans get logged'}),
  }

  protected settingKey = 'auto_explain.log_analyze' as SettingKey

  protected convertValue(val: BooleanAsString): boolean {
    return booleanConverter(val)
  }

  protected explain(setting: Setting<boolean>) {
    if (setting.value) {
      return 'EXPLAIN ANALYZE execution plans will be logged.'
    }

    return 'EXPLAIN ANALYZE execution plans will not be logged.'
  }
}
