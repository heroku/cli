import {color} from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'
import {utils} from '@heroku/heroku-cli-util'
import {formatResponseWithCommands} from '../../../lib/pg/util.js'
import {PgDatabase, PgUpgradeError, PgUpgradeResponse} from '../../../lib/pg/types.js'
import ConfirmCommand from '../../../lib/confirmCommand.js'
import {nls} from '../../../nls.js'

const heredoc = tsheredoc.default

export default class Upgrade extends Command {
  static topic = 'pg'
  static description = heredoc(`
    simulates a Postgres version upgrade on a Standard-tier and higher leader database by creating and upgrading a follower database. Heroku sends the results of the test upgrade via email.
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

    const dbResolver = new utils.pg.DatabaseResolver(this.heroku)
    const {addon: db} = await dbResolver.getAttachment(app, database)
    if (utils.pg.isLegacyEssentialDatabase(db))
      ux.error(`You can only use ${color.cmd('pg:upgrade:*')} commands on Essential-* and higher plans.`)

    if (utils.pg.isEssentialDatabase(db))
      ux.error(`You can't use ${color.cmd('pg:upgrade:dryrun')} on Essential-tier databases. You can only use this command on Standard-tier and higher leader databases.`)

    const versionPhrase = version ? heredoc(`Postgres version ${version}`) : heredoc('the latest supported Postgres version')
    const {body: replica} = await this.heroku.get<PgDatabase>(`/client/v11/databases/${db.id}`, {hostname: utils.pg.host()})
    if (replica.following)
      ux.error(`You can't use ${color.cmd('pg:upgrade:dryrun')} on follower databases. You can only use this command on Standard-tier and higher leader databases.`)

    await new ConfirmCommand().confirm(app, confirm, heredoc(`
        This command starts a test upgrade for ${color.addon(db.name)} to ${versionPhrase}.
    `))

    try {
      const data = {version}
      ux.action.start(`Starting a test upgrade on ${color.addon(db.name)}`)
      const response = await this.heroku.post<PgUpgradeResponse>(`/client/v11/databases/${db.id}/upgrade/dry_run`, {hostname: utils.pg.host(), body: data})
      ux.action.stop('done\n' + formatResponseWithCommands(response.body.message))
    } catch (error) {
      const response = error as PgUpgradeError
      ux.error(formatResponseWithCommands(response.body.message) + `\n\nError ID: ${response.body.id}`)
    }
  }
}
