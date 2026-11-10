import type {DatabaseSetting} from '@heroku/sdk/extensions/data'

import {Args} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import {PGSettingsCommand} from '../../../lib/pg/setter.js'
import {nls} from '../../../nls.js'

const heredoc = tsheredoc

export default class LogStatement extends PGSettingsCommand<'log_statement'> {
  static args = {
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`}),
    value: Args.string({description: 'type of SQL statements to log\n<options: none|ddl|mod|all>', options: ['none', 'ddl', 'mod', 'all']}),
  }
  static description = heredoc(`
    log_statement controls which SQL statements are logged.
    Valid values for VALUE:
    none - No statements are logged
    ddl  - All data definition statements, such as CREATE, ALTER and DROP will be logged
    mod  - Includes all statements from ddl as well as data-modifying statements such as INSERT, UPDATE, DELETE, TRUNCATE, COPY
    all  - All statements are logged
  `)
  protected settingKey = 'log_statement' as const

  protected convertValue(val: string): string {
    return val
  }

  protected explain(setting: DatabaseSetting<'log_statement'>) {
    return setting.values[setting.value]
  }
}
