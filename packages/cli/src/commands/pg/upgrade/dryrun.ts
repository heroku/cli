import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import heredoc from 'tsheredoc'
import {getAddon} from '../../../lib/pg/fetcher'
import pgHost from '../../../lib/pg/host'
import {legacyEssentialPlan, essentialNumPlan, formatResponseWithCommands} from '../../../lib/pg/util'
import {PgDatabase, PgUpgradeError, PgUpgradeResponse} from '../../../lib/pg/types'
import confirmCommand from '../../../lib/confirmCommand'
import {nls} from '../../../nls'

export default class Upgrade extends Command {
  static topic = 'pg';
  static description = heredoc(`
    simulates a Postgres version upgrade on a Standard-tier and higher leader database by creating and upgrading a follower database.
    Heroku sends the results of the test upgrade via email.
  `)

  static flags = {
    confirm: flags.string({char: 'c'}),
    version: flags.string({char: 'v', description: 'Postgres version to upgrade to'}),
    app: flags.app({required: true}),
  }

  static args = {
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`}),
  }

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Upgrade)
    const {app, version, confirm} = flags
    const {database} = args

    const db = await getAddon(this.heroku, app, database)
    if (legacyEssentialPlan(db))
      ux.error(`You can only use ${color.cmd('pg:upgrade:*')} commands on Essential-* and higher plans.`)

    if (essentialNumPlan(db))
      ux.error(`You can't use ${color.cmd('pg:upgrade:dryrun')} on Essential tier databases. You can only use this command on Standard-tier and higher leader databases.`)

    const {body: replica} = await this.heroku.get<PgDatabase>(`/client/v11/databases/${db.id}`, {hostname: pgHost()})
    if (replica.following)
      ux.error(`You can't use ${color.cmd('pg:upgrade:dryrun')} on follower databases. You can only use this command on Standard-tier and higher leader databases.`)

    if (version)
      await confirmCommand(app, confirm, heredoc(`
          Destructive action
          This command starts a test upgrade for ${color.addon(db.name)} to Postgres version ${version}.
      `))
    else
      await confirmCommand(app, confirm, heredoc(`
        Destructive action
        This command starts a test upgrade for ${color.addon(db.name)} to the latest supported Postgres version.
      `))

    try {
      const data = {version}
      ux.action.start(`Starting a test upgrade on ${color.addon(db.name)}`)
      const response = await this.heroku.post<PgUpgradeResponse>(`/client/v11/databases/${db.id}/upgrade/dry_run`, {hostname: pgHost(), body: data})
      ux.action.stop('done\n' + formatResponseWithCommands(response.body.message))
    } catch (error) {
      const response = error as PgUpgradeError
      ux.error(formatResponseWithCommands(response.body.message) + `\n\nError ID: ${response.body.id}`)
    }
  }
}
