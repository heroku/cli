import {Args} from '@oclif/core'
import heredoc from 'tsheredoc'
import {PGSettingsCommand, type Setting, type SettingKey, booleanConverter} from '../../../lib/pg/setter'

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
    database: Args.string(),
    value: Args.string({options: ['none', 'ddl', 'mod', 'all']}),
  }

  protected settingKey: SettingKey = 'log_statement'

  protected convertValue(val: boolean): boolean {
    return booleanConverter(val)
  }

  protected explain(setting: Setting) {
    return setting.values[setting.value]
  }
}
