import type {DatabaseSetting} from '@heroku/sdk/extensions/data'

import {flags} from '@heroku-cli/command'
import {Args} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import {type BooleanAsString, booleanConverter, PGSettingsCommand} from '../../../lib/pg/setter.js'
import {nls} from '../../../nls.js'

const heredoc = tsheredoc

export default class LogConnections extends PGSettingsCommand<'log_connections'> {
  static args = {
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`}),
    value: Args.string({description: 'boolean indicating if database login attempts get logged'}),
  }
  static description = heredoc(`
  Controls whether a log message is produced when a login attempt is made. Default is true.
  Setting log_connections to false stops emitting log messages for all attempts to login to the database.`)
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }
  static topic = 'pg'
  protected settingKey = 'log_connections' as const

  protected convertValue(val: string): boolean {
    return booleanConverter(val as BooleanAsString)
  }

  protected explain(setting: DatabaseSetting<'log_connections'>): string {
    if (setting.value) {
      return 'When login attempts are made, a log message will be emitted in your application\'s logs.'
    }

    return 'When login attempts are made, no log message will be emitted in your application\'s logs.'
  }
}
