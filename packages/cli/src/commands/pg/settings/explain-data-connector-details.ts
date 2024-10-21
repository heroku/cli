import {flags} from '@heroku-cli/command'
import {Args} from '@oclif/core'
import heredoc from 'tsheredoc'
import {type BooleanAsString, booleanConverter, PGSettingsCommand} from '../../../lib/pg/setter'
import type {Setting, SettingKey} from '../../../lib/pg/types'

export default class ExplainDataConnectorDetails extends PGSettingsCommand {
  static description = heredoc(`
  displays stats on replication slots on your database, the default value is "off"
  `)

  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  static args = {
    database: Args.string({description: 'The config var exposed to the owning app containing the database configuration.'}),
    value: Args.string({description: 'Boolean value indicating whether data replication slot details should be logged.'}),
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
