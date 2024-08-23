import {flags} from '@heroku-cli/command'
import {Args} from '@oclif/core'
import heredoc from 'tsheredoc'
import {type BooleanAsString, booleanConverter, PGSettingsCommand} from '../../../lib/pg/setter'
import type {Setting, SettingKey} from '../../../lib/pg/types'

export default class ExplainDataConnectorDetails extends PGSettingsCommand {
  static topic = 'pg'
  static description = heredoc(`
  Displays stats on replication slots on your database. The default value is "off".
  `)

  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  static args = {
    database: Args.string(),
    value: Args.string(),
  }

  protected settingKey:SettingKey = 'explain_data_connector_details'

  protected convertValue(val: BooleanAsString): boolean {
    return booleanConverter(val)
  }

  protected explain(setting: Setting<boolean>): string {
    if (setting?.value) {
      return 'Data replication slot details will be logged.'
    }

    return 'Data replication slot details will no longer be logged.'
  }
}
