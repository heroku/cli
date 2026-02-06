import {color, hux, utils} from '@heroku/heroku-cli-util'
import {flags as Flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import BaseCommand from '../../../lib/data/baseCommand.js'
import {SettingsChangeResponse, SettingsResponse} from '../../../lib/data/types.js'

const heredoc = tsheredoc.default

const settingsChangeHeaders = {
  Settings: {},
  // eslint-disable-next-line perfectionist/sort-objects
  From: {},
  To: {},
}

const settingsHeaders = {
  Setting: {},
  Value: {},
}

const settingsChangeTableData = (response: SettingsChangeResponse) => response.changes.map(change => ({
  From: color.yellow(change.previous),
  Settings: change.name,
  To: color.cyan(change.current),
}))

const settingsTableData = (response: SettingsResponse) => {
  const settingsArray = response.items.map(item => ({Setting: item.name, Value: item.current}))

  return settingsArray
}

export default class DataPgSettings extends BaseCommand {
  static args = {
    database: Args.string({
      description: 'database name, database attachment name, or related config var on an app',
      required: true,
    }),
  }

  static description = 'get or update the settings of a Postgres Advanced database'

  static examples = [
    '# Get database settings\n'
    + '<%= config.bin %> <%= command.id %> database_name -a app_name',
    '# Change ‘log_min_duration_statement’ and ‘log_statement’ settings for database\n'
    + '<%= config.bin %> <%= command.id %> database_name --set=log_min_duration_statement:2000 --set=log_statement:ddl -a app_name',
  ]

  static flags = {
    app: Flags.app({
      required: true,
    }),
    remote: Flags.remote(),
    set: Flags.string({
      description: 'Postgres setting to change in SETTING_NAME:VALUE format (example: \'track_functions:pl\' or \'log_lock_waits:1\')',
      multiple: true,
    }),
  }

  async run(): Promise<void> {
    const {args, flags} = await this.parse(DataPgSettings)
    const {database: databaseArg} = args
    const {app, set} = flags
    const settings: string = set?.map((setting: string) => setting.trim()).join(',')

    const addonResolver = new utils.AddonResolver(this.heroku)
    const database = await addonResolver.resolve(databaseArg, app, utils.pg.addonService())

    if (!utils.pg.isAdvancedDatabase(database)) {
      ux.error(heredoc(`
        You can only use this command to configure settings on Advanced-tier databases.
        See https://devcenter.heroku.com/articles/heroku-postgres-settings to configure settings on non-Advanced-tier databases.
      `))
    }

    if (settings) {
      const response = await this.dataApi.put<SettingsChangeResponse>(`/data/postgres/v1/${database.id}/settings`, {
        body: {settings},
      })

      const {body} = response

      if (body.changes.length === 0) {
        ux.stdout(
          `\nThose settings are already applied to ${color.addon(database.name)}. `
          + `Use ${color.code(`heroku data:pg:settings ${database.name} -a ${app}`)} to see the current settings on the database.`,
        )
      } else {
        const tableData = settingsChangeTableData(body)
        ux.stdout('Updating these settings...')
        hux.table(tableData, settingsChangeHeaders)
        ux.stdout(`Updating your database ${color.addon(database.name)} shortly. You can use ${color.code(
          `data:pg:info ${database.name} -a ${app}`,
        )} to track progress`,
        )
      }
    } else {
      const response = await this.dataApi.get<SettingsResponse>(`/data/postgres/v1/${database.id}/settings`)
      const {body} = response
      const tableData = settingsTableData(body)
      ux.stdout(`=== ${color.addon(database.name)}`)
      hux.table(tableData, settingsHeaders)
    }
  }
}
