import {color, utils} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import ConfirmCommand from '../../../lib/confirmCommand.js'
import {PgDatabase, PgUpgradeError, PgUpgradeResponse} from '../../../lib/pg/types.js'
import {formatResponseWithCommands} from '../../../lib/pg/util.js'
import {nls} from '../../../nls.js'

const heredoc = tsheredoc.default

export default class Upgrade extends Command {
  static args = {
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`}),
  }

  static description = heredoc(`
    prepares the upgrade for Standard-tier and higher leader databases and schedules it for the next available maintenance window. To start a version upgrade on Essential-tier and follower databases, use ${color.code('heroku pg:upgrade:run')} instead.
  `)

  static flags = {
    app: flags.app({required: true}),
    confirm: flags.string({char: 'c'}),
    version: flags.string({char: 'v', description: 'Postgres version to upgrade to'}),
  }

  static topic = 'pg'

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Upgrade)
    const {app, confirm, version} = flags
    const {database} = args

    const dbResolver = new utils.pg.DatabaseResolver(this.heroku)
    const {addon: db} = await dbResolver.getAttachment(app, database)
    if (utils.pg.isLegacyEssentialDatabase(db))
      ux.error(`You can only use ${color.code('pg:upgrade:*')} commands on Essential-* and higher plans.`)

    if (utils.pg.isEssentialDatabase(db))
      ux.error(`You can only use ${color.code('heroku pg:upgrade:prepare')} on Standard-tier and higher leader databases. For Essential-tier databases, use ${color.code('heroku pg:upgrade:run')} instead.`)

    const versionPhrase = version ? heredoc(`Postgres version ${version}`) : heredoc('the latest supported Postgres version')
    const {body: replica} = await this.heroku.get<PgDatabase>(`/client/v11/databases/${db.id}`, {hostname: utils.pg.host()})

    if (replica.following)
      ux.error(`You can only use ${color.code('heroku pg:upgrade:prepare')} on Standard-tier and higher leader databases. For follower databases, use ${color.code('heroku pg:upgrade:run')} instead.`)

    await new ConfirmCommand().confirm(app, confirm, heredoc(`
        Destructive action
        This command prepares the upgrade for ${color.datastore(db.name)} to ${versionPhrase} and schedules to upgrade it during the next available maintenance window.
    `))

    try {
      const data = {version}
      ux.action.start(`Preparing upgrade on ${color.addon(db.name)}`)
      const response = await this.heroku.post<PgUpgradeResponse>(`/client/v11/databases/${db.id}/upgrade/prepare`, {hostname: utils.pg.host(), body: data})
      ux.action.stop(heredoc(`done\n${formatResponseWithCommands(response.body.message)}`))
    } catch (error) {
      const response = error as PgUpgradeError
      ux.error(heredoc(`${formatResponseWithCommands(response.body.message)}\n\nError ID: ${response.body.id}`))
    }
  }
}
