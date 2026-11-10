import type {PostgresSettingsInfoResult, PostgresSettingsUpdateResult} from '@heroku/types/data'

import {flags as Flags} from '@heroku-cli/command'
import {color, hux} from '@heroku/heroku-cli-util'
import {postgresSettingsExtensions} from '@heroku/sdk/extensions/data'
import {NotAdvancedDatabaseError} from '@heroku/sdk/resources/data/postgres-database'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import BaseCommand from '../../../lib/data/base-command.js'
import {createSDK} from '../../../lib/sdk.js'

const heredoc = tsheredoc

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

const settingsChangeTableData = (response: PostgresSettingsUpdateResult) => (response.changes ?? []).map(change => ({
  From: color.label(change.previous?.toString() || ''),
  Settings: change.name,
  To: color.info(change.current?.toString() || ''),
}))

const settingsTableData = (response: PostgresSettingsInfoResult) => {
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

  async run(): Promise<PostgresSettingsInfoResult | PostgresSettingsUpdateResult> {
    const {args, flags} = await this.parse(DataPgSettings)
    const {database: databaseArg} = args
    const {app, set} = flags
    const settings: string | undefined = set?.map((setting: string) => setting.trim()).join(',')

    const {data} = createSDK(this.heroku, {extensions: [postgresSettingsExtensions]})

    try {
      if (settings) {
        const {addon, settings: body} = await data.postgresSettings.update(databaseArg, {settings}, {appIdentity: app})

        if ((body.changes?.length ?? 0) === 0) {
          ux.stdout(`\nThose settings are already applied to ${color.addon(addon.name)}. `
            + `Use ${color.code(`heroku data:pg:settings ${addon.name} -a ${app}`)} to see the current settings on the database.`)
        } else {
          const tableData = settingsChangeTableData(body)
          ux.stdout('Updating these settings...')
          this.log(hux.table(tableData, settingsChangeHeaders))
          ux.stdout(`Updating your database ${color.addon(addon.name)} shortly. You can use ${color.code(`data:pg:info ${addon.name} -a ${app}`)} to track progress`)
        }

        return body
      }

      const {addon, settings: body} = await data.postgresSettings.info(databaseArg, {appIdentity: app})
      const tableData = settingsTableData(body)
      ux.stdout(`=== ${color.addon(addon.name)}`)
      this.log(hux.table(tableData, settingsHeaders))
      return body
    } catch (error) {
      if (error instanceof NotAdvancedDatabaseError) {
        ux.error(heredoc(`
          You can only use this command to configure settings on Advanced-tier databases.
          See https://devcenter.heroku.com/articles/heroku-postgres-settings to configure settings on non-Advanced-tier databases.
        `))
      }

      throw error
    }
  }
}
