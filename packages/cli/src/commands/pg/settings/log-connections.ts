import {flags} from '@heroku-cli/command'
import {Args} from '@oclif/core'
import heredoc from 'tsheredoc'
import {type BooleanAsString, booleanConverter, PGSettingsCommand} from '../../../lib/pg/setter'
import type {Setting, SettingKey} from '../../../lib/pg/types'

export default class LogConnections extends PGSettingsCommand {
  static topic = 'pg'
  static description = heredoc(`
  Controls whether a log message is produced when a login attempt is made. Default is true.
  Setting log_connections to false stops emitting log messages for all attempts to login to the database.`)

  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  static args = {
    database: Args.string(),
    value: Args.string(),
  }

  protected settingKey: SettingKey = 'log_connections'

  protected convertValue(val: unknown): unknown {
    return booleanConverter(val as BooleanAsString)
  }

  protected explain(setting: Setting<unknown>): string {
    if (setting.value) {
      return 'When login attempts are made, a log message will be emitted in your application\'s logs.'
    }

    return 'When login attempts are made, no log message will be emitted in your application\'s logs.'
  }
}
