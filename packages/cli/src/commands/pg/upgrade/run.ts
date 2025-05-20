import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import heredoc from 'tsheredoc'
import {getAddon} from '../../../lib/pg/fetcher'
import pgHost from '../../../lib/pg/host'
import {legacyEssentialPlan, databaseNameFromUrl, essentialNumPlan, formatResponseWithCommands} from '../../../lib/pg/util'
import {PgDatabase, PgUpgradeError, PgUpgradeResponse} from '../../../lib/pg/types'
import * as Heroku from '@heroku-cli/schema'
import confirmCommand from '../../../lib/confirmCommand'
import {nls} from '../../../nls'

export default class Upgrade extends Command {
  static topic = 'pg';
  static description = heredoc(`
    starts a Postgres version upgrade

    On Essential-tier databases, this command upgrades the database's Postgres version.

    On Standard-tier and higher leader databases, this command runs a previously scheduled Postgres version upgrade. You must run ${color.cmd('pg:upgrade:prepare')} before this command to schedule a version upgrade.

    On follower databases, this command unfollows the leader database before upgrading the follower's Postgres version.
    `)

  static examples = [
    heredoc`
      # Upgrade an Essential-tier database to a specific version
      $ heroku pg:upgrade:run postgresql-curved-12345 --version 14 --app myapp
    `,
    heredoc`
      # Upgrade a Standard-tier follower database to the latest supported version
      $ heroku pg:upgrade:run HEROKU_POSTGRESQL_BLUE_URL --app myapp
    `,
    heredoc`
      # Run a previously scheduled upgrade on a Standard-tier leader database
      $ heroku pg:upgrade:run DATABASE_URL --app myapp
    `,
  ]

  static flags = {
    confirm: flags.string({char: 'c'}),
    version: flags.string({char: 'v', description: 'Postgres version to upgrade to'}),
    app: flags.app({required: true}),
    remote: flags.remote({char: 'r'}),
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

    const versionPhrase = version ? heredoc(`Postgres version ${version}`) : heredoc('the latest supported Postgres version')
    const {body: replica} = await this.heroku.get<PgDatabase>(`/client/v11/databases/${db.id}`, {hostname: pgHost()})

    if (essentialNumPlan(db)) {
      await confirmCommand(app, confirm, heredoc(`
        Destructive action
        You're upgrading ${color.addon(db.name)} to ${versionPhrase}.

        You can't undo this action.
      `))
    } else if (replica.following) {
      const {body: configVars} = await this.heroku.get<Heroku.ConfigVars>(`/apps/${app}/config-vars`)
      const origin = databaseNameFromUrl(replica.following, configVars)

      await confirmCommand(app, confirm, heredoc(`
        Destructive action
        You're upgrading ${color.addon(db.name)} to ${versionPhrase}. The database will stop following ${origin} and become writable.

        You can't undo this action.
      `))
    } else {
      await confirmCommand(app, confirm, heredoc(`
        Destructive action
        You're upgrading the Postgres version on ${color.addon(db.name)}. This action also upgrades any followers on the database.

        You can't undo this action.
      `))
    }

    try {
      const data = {version}
      ux.action.start(`Starting upgrade on ${color.addon(db.name)}`)
      const response = await this.heroku.post<PgUpgradeResponse>(`/client/v11/databases/${db.id}/upgrade/run`, {hostname: pgHost(), body: data})
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
