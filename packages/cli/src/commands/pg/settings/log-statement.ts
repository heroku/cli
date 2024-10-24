import {Args} from '@oclif/core'
import heredoc from 'tsheredoc'
import {type Setting, type SettingKey} from '../../../lib/pg/types'
import {PGSettingsCommand} from '../../../lib/pg/setter'
import {nls} from '../../../nls'
export default class LogStatement extends PGSettingsCommand {
  static description = heredoc(`
    log_statement controls which SQL statements are logged.
    Valid values for VALUE:
    none - No statements are logged
    ddl  - All data definition statements, such as CREATE, ALTER and DROP will be logged
    mod  - Includes all statements from ddl as well as data-modifying statements such as INSERT, UPDATE, DELETE, TRUNCATE, COPY
    all  - All statements are logged
  `)

  static args = {
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`}),
    value: Args.string({options: ['none', 'ddl', 'mod', 'all'], description: 'type of SQL statements to log\n<options: none|ddl|mod|all>'}),
  }

  protected settingKey: SettingKey = 'log_statement'

  protected convertValue(val: string): string {
    return val
  }

  protected explain(setting: Setting<string>) {
    return setting.values[setting.value]
  }
}
