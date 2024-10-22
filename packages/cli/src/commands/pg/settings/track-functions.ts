import {Args} from '@oclif/core'
import heredoc from 'tsheredoc'
import {PGSettingsCommand} from '../../../lib/pg/setter'
import type {Setting, SettingKey} from '../../../lib/pg/types'

// ref: https://www.postgresql.org/docs/current/runtime-config-statistics.html#GUC-TRACK-FUNCTIONS
export default class TrackFunctions extends PGSettingsCommand {
  static description = heredoc(`
    track_functions controls tracking of function call counts and time used. Default is none.
    Valid values for VALUE:
    none - No functions are tracked (default)
    pl   - Only procedural language functions are tracked
    all  - All functions, including SQL and C language functions, are tracked. Simple SQL-language that are inlined are not tracked`)

  static args = {
    database: Args.string({description: 'add-on ID, config var name, provider ID, plan name or globally unique name of the database add-on. If omitted, we use DATABASE_URL.'}),
    value: Args.string({options: ['none', 'pl', 'all'], description: 'The function types to be tracked.'}),
  }

  protected settingKey: SettingKey = 'track_functions'

  protected convertValue(val: unknown): unknown {
    return val
  }

  protected explain(setting: Setting<keyof Setting<unknown>['value']>): string {
    return setting.values[setting.value]
  }
}
