import {color, utils} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import ConfirmCommand from '../../../lib/confirmCommand.js'
import {PgDatabase, PgUpgradeError, PgUpgradeResponse} from '../../../lib/pg/types.js'
import {databaseNameFromUrl, formatResponseWithCommands} from '../../../lib/pg/util.js'
import {nls} from '../../../nls.js'

const heredoc = tsheredoc.default

export default class Upgrade extends Command {
  static args = {
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`}),
  }

  static description = heredoc(`
    starts a Postgres version upgrade

    On Essential-tier databases, this command upgrades the database's Postgres version.

    On Standard-tier and higher leader databases, this command runs a previously scheduled Postgres version upgrade. You must run ${color.code('pg:upgrade:prepare')} before this command to schedule a version upgrade.

    On follower databases, this command unfollows the leader database before upgrading the follower's Postgres version.
    `)

  static examples = [
    heredoc`
      # Upgrade an Essential-tier database to a specific version
      ${color.command('heroku pg:upgrade:run postgresql-curved-12345 --version 14 --app myapp')}
    `,
    heredoc`
      # Upgrade a Standard-tier follower database to the latest supported version
      ${color.command('heroku pg:upgrade:run HEROKU_POSTGRESQL_BLUE_URL --app myapp')}
    `,
    heredoc`
      # Run a previously scheduled upgrade on a Standard-tier leader database
      ${color.command('heroku pg:upgrade:run DATABASE_URL --app myapp')}
    `,
  ]

  static flags = {
    app: flags.app({required: true}),
    confirm: flags.string({char: 'c'}),
    remote: flags.remote({char: 'r'}),
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

    const versionPhrase = version ? heredoc(`Postgres version ${version}`) : heredoc('the latest supported Postgres version')
    const {body: replica} = await this.heroku.get<PgDatabase>(`/client/v11/databases/${db.id}`, {hostname: utils.pg.host()})

    if (utils.pg.isEssentialDatabase(db)) {
      await new ConfirmCommand().confirm(app, confirm, heredoc(`
        Destructive action
        You're upgrading ${color.addon(db.name)} to ${versionPhrase}.

        You can't undo this action.
      `))
    } else if (replica.following) {
      const {body: configVars} = await this.heroku.get<Heroku.ConfigVars>(`/apps/${app}/config-vars`)
      const origin = databaseNameFromUrl(replica.following, configVars)

      await new ConfirmCommand().confirm(app, confirm, heredoc(`
        Destructive action
        You're upgrading ${color.addon(db.name)} to ${versionPhrase}. The database will stop following ${origin} and become writable.

        You can't undo this action.
      `))
    } else {
      await new ConfirmCommand().confirm(app, confirm, heredoc(`
        Destructive action
        You're upgrading the Postgres version on ${color.addon(db.name)}. This action also upgrades any followers on the database.

        You can't undo this action.
      `))
    }

    try {
      const data = {version}
      ux.action.start(`Starting upgrade on ${color.datastore(db.name)}`)
      const response = await this.heroku.post<PgUpgradeResponse>(`/client/v11/databases/${db.id}/upgrade/run`, {hostname: utils.pg.host(), body: data})
      ux.action.stop(heredoc(`done\n${formatResponseWithCommands(response.body.message)}`))
    } catch (error) {
      if (error instanceof Error && 'body' in error) {
        const response = error as PgUpgradeError
        ux.error(heredoc(`${formatResponseWithCommands(response.body.message)}\n\nError ID: ${response.body.id}`))
      } else {
        throw error
      }
    }
  }
}
