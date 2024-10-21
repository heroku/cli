import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import {getAddon} from '../../../lib/pg/fetcher'
import {essentialPlan} from '../../../lib/pg/util'
import confirmCommand from '../../../lib/confirmCommand'
import heredoc from 'tsheredoc'
import pgHost from '../../../lib/pg/host'

export default class Destroy extends Command {
  static topic = 'pg';
  static description = 'destroys a link between data stores';
  static example = '$ heroku pg:links:destroy HEROKU_POSTGRESQL_CERULEAN redis-symmetrical-100';

  static flags = {
    app: flags.app({required: true}),
    confirm: flags.string({char: 'c'}),
    remote: flags.remote(),
  };

  static args = {
    database: Args.string({required: true, description: 'The config var exposed to the owning app containing the database configuration.'}),
    link: Args.string({required: true, description: 'The name of the linked data store.'}),
  };

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Destroy)
    const {app, confirm} = flags
    const {database, link} = args
    const db = await getAddon(this.heroku, app, database)
    if (essentialPlan(db))
      throw new Error('pg:links isn’t available for Essential-tier databases.')
    await confirmCommand(app, confirm, heredoc(`
      Destructive action
      This command will affect the database ${color.yellow(db.name)}
      This will delete ${color.cyan(link)} along with the tables and views created within it.
      This may have adverse effects for software written against the ${color.cyan(link)} schema.
    `))

    ux.action.start(`Destroying link ${color.cyan(link)} from ${color.yellow(db.name)}`)
    await this.heroku.delete(
      `/client/v11/databases/${db.id}/links/${encodeURIComponent(link)}`,
      {hostname: pgHost()},
    )
    ux.action.stop()
  }
}
