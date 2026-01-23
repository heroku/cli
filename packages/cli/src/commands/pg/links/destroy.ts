import {color, utils} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import ConfirmCommand from '../../../lib/confirmCommand.js'
import {essentialPlan} from '../../../lib/pg/util.js'
const heredoc = tsheredoc.default
import {nls} from '../../../nls.js'

export default class Destroy extends Command {
  static args = {
    database: Args.string({description: nls('pg:database:arg:description'), required: true}),
    link: Args.string({description: 'name of the linked data store', required: true}),
  }

  static description = 'destroys a link between data stores'
  static example = `${color.command('heroku pg:links:destroy HEROKU_POSTGRESQL_CERULEAN redis-symmetrical-100')}`

  static flags = {
    app: flags.app({required: true}),
    confirm: flags.string({char: 'c'}),
    remote: flags.remote(),
  }

  static topic = 'pg'

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Destroy)
    const {app, confirm} = flags
    const {database, link} = args
    const dbResolver = new utils.pg.DatabaseResolver(this.heroku)
    const {addon: db} = await dbResolver.getAttachment(app, database)
    if (essentialPlan(db))
      throw new Error("pg:links isn't available for Essential-tier databases.")
    await new ConfirmCommand().confirm(app, confirm, heredoc(`
      Destructive action
      This command will affect the database ${color.yellow(db.name)}
      This will delete ${color.cyan(link)} along with the tables and views created within it.
      This may have adverse effects for software written against the ${color.cyan(link)} schema.
    `))

    ux.action.start(`Destroying link ${color.cyan(link)} from ${color.yellow(db.name)}`)
    await this.heroku.delete(
      `/client/v11/databases/${db.id}/links/${encodeURIComponent(link)}`,
      {hostname: utils.pg.host()},
    )
    ux.action.stop()
  }
}
