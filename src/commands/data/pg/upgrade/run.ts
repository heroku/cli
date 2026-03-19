import {flags as Flags} from '@heroku-cli/command'
import {color, hux, utils} from '@heroku/heroku-cli-util'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import BaseCommand from '../../../../lib/data/baseCommand.js'
import {InfoResponse, UpgradeResponse} from '../../../../lib/data/types.js'

const heredoc = tsheredoc.default

export default class DataPgUpgradeRun extends BaseCommand {
  static args = {
    database: Args.string({
      description: 'database name, database attachment name, or related config var on an app',
      required: true,
    }),
  }

  static description = 'upgrade the Postgres version on a Heroku Postgres Advanced database'

  static examples = [
    heredoc`
      # Upgrade a Heroku Postgres Advanced database to version 17
      <%= config.bin %> <%= command.id %> DATABASE --version 17 --app my-app
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

    const dbResolver = new utils.pg.DatabaseResolver(this.heroku)
    const {addon} = await dbResolver.getAttachment(app, database)

    if (!utils.pg.isAdvancedDatabase(addon)) {
      ux.error(
        'You can only use this command on Advanced-tier databases.\n'
          + `Run ${color.code(`heroku pg:upgrade:run ${addon.name} --app ${app}`)} instead.`,
      )
    }

    const {body: databaseInfo} = await this.dataApi.get<InfoResponse>(`/data/postgres/v1/${addon.id}/info`)
    const {version: currentVersion} = databaseInfo
    const newVersion = version ?? 'the latest supported Postgres version'
    await hux.confirmCommand({
      comparison: app,
      confirmation: confirm,
      warningMessage: heredoc(`
        This command immediately upgrades your ${color.datastore(addon.name)} database from ${currentVersion} to ${newVersion}.
        Your database will be unavailable until the upgrade is complete.`),
    })

    try {
      ux.action.start(`Upgrading your ${color.datastore(addon.name)} database from ${currentVersion} to ${newVersion}`)
      const {body: {message}} = await this.dataApi.post<UpgradeResponse>(
        `/data/postgres/v1/${addon.id}/upgrade/run`,
        {body: {version}},
      )
      ux.action.stop(heredoc(`
        done

        ${color.info(message)}
      `))
    } catch (error: unknown) {
      ux.action.stop(color.red('!'))
      throw error
    }
  }
}
