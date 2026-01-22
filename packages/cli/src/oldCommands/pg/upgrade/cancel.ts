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
  static topic = 'pg';
  static description = heredoc(`
    cancels a scheduled upgrade. You can't cancel a version upgrade that's in progress.
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

    const dbResolver = new utils.pg.DatabaseResolver(this.heroku)
    const {addon: db} = await dbResolver.getAttachment(app, database)
    if (utils.pg.isLegacyEssentialDatabase(db))
      ux.error(`You can only use ${color.cmd('pg:upgrade:*')} commands on Essential-* and higher plans.`)

    if (utils.pg.isEssentialDatabase(db))
      ux.error(`You can't use ${color.cmd('pg:upgrade:cancel')} on Essential-tier databases. You can only use this command on Standard-tier and higher leader databases.`)

    const {body: replica} = await this.heroku.get<PgDatabase>(`/client/v11/databases/${db.id}`, {hostname: utils.pg.host()})
    if (replica.following)
      ux.error(`You can't use ${color.cmd('pg:upgrade:cancel')} on follower databases. You can only use this command on Standard-tier and higher leader databases.`)

    await new ConfirmCommand().confirm(app, confirm, heredoc(`
      Destructive action
      You're canceling the scheduled version upgrade for ${color.addon(db.name)}.

      You can't undo this action.
    `))

    try {
      ux.action.start(`Cancelling upgrade on ${color.addon(db.name)}`)
      const response = await this.heroku.post<PgUpgradeResponse>(`/client/v11/databases/${db.id}/upgrade/cancel`, {hostname: utils.pg.host(), body: {}})
      ux.action.stop('done\n' + formatResponseWithCommands(response.body.message))
    } catch (error) {
      const response = error as PgUpgradeError
      ux.error(formatResponseWithCommands(response.body.message) + `\n\nError ID: ${response.body.id}`)
    }
  }
}
