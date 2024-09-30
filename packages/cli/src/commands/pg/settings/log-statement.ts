import {Args} from '@oclif/core'
import heredoc from 'tsheredoc'
import {type Setting, type SettingKey} from '../../../lib/pg/types'
import {type ArgTypes, PGSettingsCommand} from '../../../lib/pg/setter'

const values =  new Set(['none', 'ddl', 'mod', 'all'])
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
    database: Args.string({optional: true}),
    value: Args.string({optional: true}),
  }

  protected settingKey: SettingKey = 'log_statement'

  protected invariant(args: ArgTypes): ArgTypes {
    const {value, database} = args
    if (values.has(database ?? '')) {
      return {value: database, database: value}
    }

    return args
  }

  protected convertValue(val: string): string {
    return val
  }

  protected explain(setting: Setting<string>) {
    return setting.values[setting.value]
  }
}
