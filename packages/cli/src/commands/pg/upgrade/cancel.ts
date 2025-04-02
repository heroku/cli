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
    cancels a prepared upgrade, doesn't cancel an active upgrade.
  `)

  static flags = {
    confirm: flags.string({char: 'c'}),
    app: flags.app({required: true}),
  }

  static args = {
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`}),
  }

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Upgrade)
    const {app, confirm} = flags
    const {database} = args

    const db = await getAddon(this.heroku, app, database)
    if (legacyEssentialPlan(db))
      ux.error(`You can only use ${color.cmd('pg:upgrade:*')} commands on Essential-* and higher plans.`)

    if (essentialNumPlan(db))
      ux.error(`You can't use ${color.cmd('pg:upgrade:cancel')} on Essential tier databases. You can only use this command on Standard-tier and higher leader databases.`)

    const {body: replica} = await this.heroku.get<PgDatabase>(`/client/v11/databases/${db.id}`, {hostname: pgHost()})
    if (replica.following)
      ux.error(`You can't use ${color.cmd('pg:upgrade:prepare')} on follower databases.  You can only use this command on Standard-tier and higher leader databases.`)

    await confirmCommand(app, confirm, heredoc(`
      Destructive action
      You're cancelling the version upgrade for ${color.addon(db.name)}.

      You can't undo this action.
    `))

    try {
      ux.action.start(`Cancelling upgrade on ${color.addon(db.name)}`)
      const response = await this.heroku.post<PgUpgradeResponse>(`/client/v11/databases/${db.id}/upgrade/cancel`, {hostname: pgHost(), body: {}})
      ux.action.stop('done\n' + formatResponseWithCommands(response.body.message))
    } catch (error) {
      const response = error as PgUpgradeError
      ux.error(formatResponseWithCommands(response.body.message) + `\n\nError ID: ${response.body.id}`)
    }
  }
}
