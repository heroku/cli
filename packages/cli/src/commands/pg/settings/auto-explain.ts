import {flags} from '@heroku-cli/command'
import {Args} from '@oclif/core'
import heredoc from 'tsheredoc'
import {BooleanAsString, booleanConverter, PGSettingsCommand} from '../../../lib/pg/setter'
import {Setting, SettingKey} from '../../../lib/pg/types'
import {nls} from '../../../nls'

// ref: https://www.postgresql.org/docs/current/auto-explain.html
export default class AutoExplain extends PGSettingsCommand {
  static topic = 'pg';
  static description = heredoc(`
  Automatically log execution plans of queries without running EXPLAIN by hand.
  The auto_explain module is loaded at session-time so existing connections will not be logged.
  Restart your Heroku app and/or restart existing connections for logging to start taking place.
  `)

  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  static args = {
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`}),
    value: Args.string(),
  }

  static strict = false

  protected settingKey: SettingKey = 'auto_explain'

  protected convertValue(val: BooleanAsString): boolean {
    return booleanConverter(val)
  }

  protected explain(setting: Setting<boolean>): string {
    if (setting.value) {
      return 'Execution plans of queries will be logged for future connections.'
    }

    return 'Execution plans of queries will not be logged for future connections.'
  }
}
