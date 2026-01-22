import {color} from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'
import {utils} from '@heroku/heroku-cli-util'
import {databaseNameFromUrl, formatResponseWithCommands} from '../../../lib/pg/util.js'
import {PgDatabase, PgUpgradeError, PgUpgradeResponse} from '../../../lib/pg/types.js'
import * as Heroku from '@heroku-cli/schema'
import ConfirmCommand from '../../../lib/confirmCommand.js'
import {nls} from '../../../nls.js'

const heredoc = tsheredoc.default

export default class Upgrade extends Command {
  static topic = 'pg';
  static description = heredoc(`
    We're deprecating this command. To upgrade your database's Postgres version, use the new ${color.cmd('pg:upgrade:*')} subcommands. See https://devcenter.heroku.com/changelog-items/3179.

    For an Essential-tier plan, this command upgrades the database's Postgres version. For a Standard-tier and higher plan, this command unfollows the leader database before upgrading the Postgres version.
    `)

  static flags = {
    confirm: flags.string({char: 'c'}),
    version: flags.string({char: 'v', description: 'Postgres version to upgrade to'}),
    app: flags.app({required: true}),
    remote: flags.remote(),
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
      ux.error(`You can only use ${color.cmd('heroku pg:upgrade')} on Essential-tier databases and follower databases on Standard-tier and higher plans.`)

    const versionPhrase = version ? heredoc(`Postgres version ${version}`) : heredoc('the latest supported Postgres version')
    const {body: replica} = await this.heroku.get<PgDatabase>(`/client/v11/databases/${db.id}`, {hostname: utils.pg.host()})

    if (replica.following) {
      const {body: configVars} = await this.heroku.get<Heroku.ConfigVars>(`/apps/${app}/config-vars`)
      const origin = databaseNameFromUrl(replica.following, configVars)

      await new ConfirmCommand().confirm(app, confirm, heredoc(`
        We're deprecating this command. To upgrade your database's Postgres version, use the new ${color.cmd('pg:upgrade:*')} subcommands. See https://devcenter.heroku.com/changelog-items/3179.

        Destructive action
        You're upgrading ${color.addon(db.name)} to ${versionPhrase}. The database will stop following ${origin} and become writable.

        You can't undo this action.
      `))
    } else if (utils.pg.isEssentialDatabase(db)) {
      await new ConfirmCommand().confirm(app, confirm, heredoc(`
        We're deprecating this command. To upgrade your database's Postgres version, use the new ${color.cmd('pg:upgrade:*')} subcommands. See https://devcenter.heroku.com/changelog-items/3179.

        Destructive action
        You're upgrading ${color.addon(db.name)} to ${versionPhrase}.

        You can't undo this action.
      `))
    } else {
      ux.warn(heredoc(`
        We're deprecating this command. To upgrade your database's Postgres version, use the new ${color.cmd('pg:upgrade:*')} subcommands. See https://devcenter.heroku.com/changelog-items/3179.`,
      ))
      ux.error(`You can only use ${color.cmd('heroku pg:upgrade')} on Essential-tier databases and follower databases on Standard-tier and higher plans.`)
    }

    try {
      const data = {version}
      ux.action.start(`Starting upgrade on ${color.addon(db.name)}`)
      const response = await this.heroku.post<PgUpgradeResponse>(`/client/v11/databases/${db.id}/upgrade`, {hostname: utils.pg.host(), body: data})
      ux.action.stop(heredoc(`done\n${formatResponseWithCommands(response.body.message)}`))
    } catch (error) {
      const response = error as PgUpgradeError
      ux.error(heredoc(`${formatResponseWithCommands(response.body.message)}\n\nError ID: ${response.body.id}`))
    }
  }
}
