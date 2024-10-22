import {Args} from '@oclif/core'
import heredoc from 'tsheredoc'
import {PGSettingsCommand, booleanConverter, BooleanAsString} from '../../../../lib/pg/setter'
import {SettingKey, Setting} from '../../../../lib/pg/types'

export default class LogAnalyze extends PGSettingsCommand {
  static topic = 'pg'
  static description = heredoc(`
    Shows actual run times on the execution plan.
    This is equivalent to calling EXPLAIN ANALYZE.

    WARNING: EXPLAIN ANALYZE will be run on ALL queries, not just logged queries. This can cause significant performance impacts to your database and should be used with caution.
  `)

  static args = {
    database: Args.string({description: 'add-on ID, config var name, provider ID, plan name or globally unique name of the database add-on. If omitted, we use DATABASE_URL.'}),
    value: Args.string({description: 'boolean indicating whether execution plans should be logged.'}),
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
