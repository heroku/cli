import {flags} from '@heroku-cli/command'
import {Args} from '@oclif/core'
import heredoc from 'tsheredoc'
import {type BooleanAsString, booleanConverter, PGSettingsCommand} from '../../../lib/pg/setter'
import type {Setting, SettingKey} from '../../../lib/pg/types'
import {nls} from '../../../nls'

export default class ExplainDataConnectorDetails extends PGSettingsCommand {
  static description = heredoc(`
  displays stats on replication slots on your database, the default value is "off"
  `)

  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  static args = {
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`}),
    value: Args.string({description: 'boolean indicating if data replication slot details get logged'}),
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
