import {flags as Flags} from '@heroku-cli/command'
import {color, hux} from '@heroku/heroku-cli-util'
import {postgresExtensions} from '@heroku/sdk/extensions/data'
import {NotAdvancedDatabaseError} from '@heroku/sdk/resources/data/postgres-database'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import BaseCommand from '../../../../lib/data/base-command.js'
import {createSDK} from '../../../../lib/sdk.js'

const heredoc = tsheredoc

export default class DataPgUpgradeRun extends BaseCommand {
  static args = {
    database: Args.string({
      description: 'database name, database attachment name, or related config var on an app',
      required: true,
    }),
  }
  static description = 'upgrade the Postgres version on a Postgres Advanced database'
  static examples = [
    heredoc`
      # Upgrade a Postgres Advanced database to version 17
      ${color.code('<%= config.bin %> <%= command.id %> DATABASE --version 17 --app my-app')}
    `,
  ]
  static flags = {
    app: Flags.app({required: true}),
    confirm: Flags.string({char: 'c', description: 'pass in the app name to skip confirmation prompts'}),
    remote: Flags.remote(),
    version: Flags.string({char: 'v', description: 'Postgres version to upgrade to'}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(DataPgUpgradeRun)
    const {app, confirm, version} = flags
    const {database} = args
    const {data} = createSDK(this.heroku, {extensions: [postgresExtensions]})
    const newVersion = version ?? 'the latest supported Postgres version'

    try {
      const {addon} = await data.postgres.runUpgrade(app, database, {version}, {
        async beforeRunUpgrade({addon, currentVersion}) {
          await hux.confirmCommand({
            comparison: app,
            confirmation: confirm,
            warningMessage: heredoc(`
              This command immediately upgrades your ${color.datastore(addon.name)} database from ${currentVersion} to ${newVersion}.
              Your database will be unavailable until the upgrade is complete.`),
          })

          ux.action.start(`Upgrading your ${color.datastore(addon.name)} database from ${currentVersion} to ${newVersion}`)
        },
      })
      ux.action.stop()
      ux.stderr(`Upgrade started. Use ${color.code(`heroku data:pg:upgrade:wait ${addon.name} -a ${app}`)} to monitor progress.`)
    } catch (error) {
      if (error instanceof NotAdvancedDatabaseError) {
        ux.error('You can only use this command on Advanced-tier databases.\n'
            + `Use ${color.code(`heroku pg:upgrade:run ${error.addon.name} --app ${app}`)} instead.`)
      }

      ux.action.stop(color.red('!'))
      throw error
    }
  }
}
