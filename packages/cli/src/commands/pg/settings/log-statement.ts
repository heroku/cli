import {Args} from '@oclif/core'
import heredoc from 'tsheredoc'
import {type Setting, type SettingKey} from '../../../lib/pg/types'
import {PGSettingsCommand} from '../../../lib/pg/setter'
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
    database: Args.string({description: 'add-on ID, config var name, provider ID, plan name or globally unique name of the database add-on. If omitted, we use DATABASE_URL.'}),
    value: Args.string({options: ['none', 'ddl', 'mod', 'all'], description: 'Which SQL statements to be logged.'}),
  }

  protected settingKey: SettingKey = 'log_statement'

  protected convertValue(val: string): string {
    return val
  }

  protected explain(setting: Setting<string>) {
    return setting.values[setting.value]
  }
}
