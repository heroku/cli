import type {DatabaseSetting} from '@heroku/sdk/extensions/data'

import {Args} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import {BooleanAsString, booleanConverter, PGSettingsCommand} from '../../../../lib/pg/setter.js'
import {nls} from '../../../../nls.js'

const heredoc = tsheredoc

export default class LogAnalyze extends PGSettingsCommand<'auto_explain.log_analyze'> {
  static args = {
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`}),
    value: Args.string({description: 'boolean indicating if execution plans get logged'}),
  }
  static description = heredoc(`
    Shows actual run times on the execution plan.
    This is equivalent to calling EXPLAIN ANALYZE.

    WARNING: EXPLAIN ANALYZE will be run on ALL queries, not just logged queries. This can cause significant performance impacts to your database and should be used with caution.
  `)
  static topic = 'pg'
  protected settingKey = 'auto_explain.log_analyze' as const

  protected convertValue(val: BooleanAsString): boolean {
    return booleanConverter(val)
  }

  protected explain(setting: DatabaseSetting<'auto_explain.log_analyze'>) {
    if (setting.value) {
      return 'EXPLAIN ANALYZE execution plans will be logged.'
    }

    return 'EXPLAIN ANALYZE execution plans will not be logged.'
  }
}
