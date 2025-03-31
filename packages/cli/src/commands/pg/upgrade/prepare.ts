import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import heredoc from 'tsheredoc'
import {getAddon} from '../../../lib/pg/fetcher'
import pgHost from '../../../lib/pg/host'
import {legacyEssentialPlan, databaseNameFromUrl} from '../../../lib/pg/util'
import {PgDatabase} from '../../../lib/pg/types'
import * as Heroku from '@heroku-cli/schema'
import confirmCommand from '../../../lib/confirmCommand'
import {nls} from '../../../nls'
import internal = require('stream')

export default class Upgrade extends Command {
  static topic = 'pg';
  static description = heredoc(`
    Prepares the upgrade for Standard-tier and higher leader databases and schedules it for the next available maintenance window. Use ${color.cmd('heroku pg:upgrade:run')} for Essential-tier or follower databases instead.
  `)

  static flags = {
    confirm: flags.string({char: 'c'}),
    version: flags.string({char: 'v', description: 'PostgreSQL version to upgrade to'}),
    app: flags.app({required: true}),
  }

  static args = {
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`}),
  }

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Upgrade)
    const {app, version, confirm} = flags
    const {database} = args
    const v = version ?? '16'

    const db = await getAddon(this.heroku, app, database)
    if (legacyEssentialPlan(db))
      ux.error(`You can only use ${color.cmd('heroku pg:upgrade:prepare')} on Standard-tier and higher leader databases. For Essential-tier databases, use ${color.cmd('heroku pg:upgrade:run')} instead.`)

    const {body: replica} = await this.heroku.get<PgDatabase>(`/client/v11/databases/${db.id}`, {hostname: pgHost()})
    if (replica.following)
      ux.error(`You can only use ${color.cmd('heroku pg:upgrade:prepare')} on Standard-tier and higher leader databases. For follower databases, use ${color.cmd('heroku pg:upgrade:run')} instead.`)

    await confirmCommand(app, confirm, heredoc(`
        Destructive action
        This command prepares the upgrade for ${color.addon(db.name)} to PostgreSQL version ${v} and schedules to upgrade it during the next available maintenance window.
    `))

    const data = {version}
    ux.action.start(`Preparing upgrade on ${color.addon(db.name)}`)
    await this.heroku.post(`/client/v11/databases/${db.id}/upgrade/prepare`, {hostname: pgHost(), body: data})
    ux.action.stop(`Use ${color.cmd('heroku pg:upgrade:wait')} to track status`)
  }
}
