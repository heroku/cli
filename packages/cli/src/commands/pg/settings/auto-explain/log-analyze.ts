import {Args} from '@oclif/core'
import heredoc from 'tsheredoc'
import {PGSettingsCommand, boolean} from '../../../../lib/pg/setter'
import {FormationSetting, Setting} from '../../../../lib/pg/types'

export default class LogAnalyze extends PGSettingsCommand {
  static topic = 'pg'
  // static command = 'settings:auto-explain:log-analyze'
  static description = heredoc(`
    Shows actual run times on the execution plan.
    This is equivalent to calling EXPLAIN ANALYZE.

    WARNING: EXPLAIN ANALYZE will be run on ALL queries, not just logged queries. This can cause significant performance impacts to your database and should be used with caution.
  `)

  static args = {
    database: Args.string(),
    value: Args.string(),
  }

  protected settingsName = 'auto_explain.log_analyze' as FormationSetting

  protected convertValue(val: string): boolean {
    return boolean(val)
  }

  protected explain(setting: Setting<boolean>) {
    if (setting.value) {
      return 'EXPLAIN ANALYZE execution plans will be logged.'
    }

    return 'EXPLAIN ANALYZE execution plans will not be logged.'
  }
}
