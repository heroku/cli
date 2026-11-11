import type {DatabaseSetting} from '@heroku/sdk/extensions/data'

import {Args} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import {BooleanAsString, booleanConverter, PGSettingsCommand} from '../../../../lib/pg/setter.js'
import {nls} from '../../../../nls.js'

const heredoc = tsheredoc

export default class LogBuffersWaits extends PGSettingsCommand<'auto_explain.log_buffers'> {
  static args = {
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`}),
    value: Args.string({description: 'boolean indicating if the database has buffer statistics enabled'}),
  }
  static description = heredoc(`
    Includes buffer usage statistics when execution plans are logged.
    This is equivalent to calling EXPLAIN BUFFERS and can only be used in conjunction with pg:settings:auto-explain:log-analyze turned on.
  `)
  static topic = 'pg'
  protected settingKey = 'auto_explain.log_buffers' as const

  protected convertValue(val: BooleanAsString): boolean {
    return booleanConverter(val)
  }

  protected explain(setting: DatabaseSetting<'auto_explain.log_buffers'>) {
    if (setting.value) {
      return 'Buffer statistics have been enabled for auto_explain.'
    }

    return 'Buffer statistics have been disabled for auto_explain.'
  }
}
