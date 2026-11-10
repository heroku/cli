import type {DatabaseSetting} from '@heroku/sdk/extensions/data'

import {flags} from '@heroku-cli/command'
import {Args} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import {type BooleanAsString, booleanConverter, PGSettingsCommand} from '../../../lib/pg/setter.js'
import {nls} from '../../../nls.js'

const heredoc = tsheredoc

export default class DataConnectorDetailsLogs extends PGSettingsCommand<'data_connector_details_logs'> {
  static aliases = ['pg:settings:explain-data-connector-details']
  static args = {
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`}),
    value: Args.string({description: 'boolean indicating if data replication slot details get logged'}),
  }
  static description = heredoc(`
  displays stats on replication slots on your database, the default value is "off"
  `)
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }
  protected settingKey = 'data_connector_details_logs' as const

  protected convertValue(val: BooleanAsString): boolean {
    return booleanConverter(val)
  }

  protected explain(setting: DatabaseSetting<'data_connector_details_logs'>): string {
    if (setting?.value) {
      return 'Data replication slot details will be logged.'
    }

    return 'Data replication slot details will no longer be logged.'
  }
}
