import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import heredoc from 'tsheredoc'
import {utils} from '@heroku/heroku-cli-util'
import {legacyEssentialPlan, essentialNumPlan, formatResponseWithCommands} from '../../../lib/pg/util'
import {PgDatabase, PgUpgradeError, PgUpgradeResponse} from '../../../lib/pg/types'
import confirmCommand from '../../../lib/confirmCommand'
import {nls} from '../../../nls'

export default class Upgrade extends Command {
  static topic = 'pg';
  static description = heredoc(`
    prepares the upgrade for Standard-tier and higher leader databases and schedules it for the next available maintenance window. To start a version upgrade on Essential-tier and follower databases, use ${color.cmd('heroku pg:upgrade:run')} instead.
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
    if (legacyEssentialPlan(db))
      ux.error(`You can only use ${color.cmd('pg:upgrade:*')} commands on Essential-* and higher plans.`)

    if (essentialNumPlan(db))
      ux.error(`You can only use ${color.cmd('heroku pg:upgrade:prepare')} on Standard-tier and higher leader databases. For Essential-tier databases, use ${color.cmd('heroku pg:upgrade:run')} instead.`)

    const versionPhrase = version ? heredoc(`Postgres version ${version}`) : heredoc('the latest supported Postgres version')
    const {body: replica} = await this.heroku.get<PgDatabase>(`/client/v11/databases/${db.id}`, {hostname: utils.pg.host()})

    if (replica.following)
      ux.error(`You can only use ${color.cmd('heroku pg:upgrade:prepare')} on Standard-tier and higher leader databases. For follower databases, use ${color.cmd('heroku pg:upgrade:run')} instead.`)

    await confirmCommand(app, confirm, heredoc(`
        Destructive action
        This command prepares the upgrade for ${color.addon(db.name)} to ${versionPhrase} and schedules to upgrade it during the next available maintenance window.
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
