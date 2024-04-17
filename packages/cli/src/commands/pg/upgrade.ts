import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import heredoc from 'tsheredoc'
import {getAddon} from '../../lib/pg/fetcher'
import pgHost from '../../lib/pg/host'
import {legacyEssentialPlan, databaseNameFromUrl} from '../../lib/pg/util'
import {PgDatabase} from '../../lib/pg/types'
import * as Heroku from '@heroku-cli/schema'
import confirmApp from '../../lib/apps/confirm-app'

export default class Upgrade extends Command {
  static topic = 'pg';
  static description = heredoc(`
    For an Essential-* plan, this command upgrades the database's PostgreSQL version. For a Standard-tier and higher plan, this command unfollows the leader database before upgrading the PostgreSQL version.
    To upgrade to another PostgreSQL version, use pg:copy instead
  `)

  static flags = {
    confirm: flags.string({char: 'c'}),
    version: flags.string({char: 'v', description: 'PostgreSQL version to upgrade to'}),
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  static args = {
    database: Args.string(),
  }

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Upgrade)
    const {app, version, confirm} = flags
    const {database} = args

    const db = await getAddon(this.heroku, app, database)
    if (legacyEssentialPlan(db))
      ux.error('pg:upgrade is only available for Essential-* databases and follower databases on Standard-tier and higher plans.')
    const {body: replica} = await this.heroku.get<PgDatabase>(`/client/v11/databases/${db.id}`, {hostname: pgHost()})
    if (replica.following) {
      const {body: configVars} = await this.heroku.get<Heroku.ConfigVars>(`/apps/${app}/config-vars`)
      const origin = databaseNameFromUrl(replica.following, configVars)
      await confirmApp(app, confirm, heredoc(`
        Destructive action
        ${color.addon(db.name)} will be upgraded to a newer PostgreSQL version, stop following ${origin}, and become writable.

        This cannot be undone.
      `))
    } else {
      await confirmApp(app, confirm, heredoc(`
        Destructive action
        ${color.addon(db.name)} will be upgraded to a newer PostgreSQL version.

        This cannot be undone.
      `))
    }

    const data = {version}
    ux.action.start(`Starting upgrade of ${color.addon(db.name)}`)
    await this.heroku.post(`/client/v11/databases/${db.id}/upgrade`, {hostname: pgHost(), body: data})
    ux.action.stop(`Use ${color.cmd('heroku pg:wait')} to track status`)
  }
}
