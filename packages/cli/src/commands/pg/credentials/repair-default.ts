import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import {getAddon} from '../../../lib/pg/fetcher'
import {essentialPlan} from '../../../lib/pg/util'
import confirmCommand from '../../../lib/confirmCommand'
import heredoc from 'tsheredoc'
import pgHost from '../../../lib/pg/host'

export default class RepairDefault extends Command {
  static topic = 'pg';
  static description = 'repair the permissions of the default credential within database';
  static example = '$ heroku pg:credentials:repair-default postgresql-something-12345';
  static flags = {
    confirm: flags.string({char: 'c'}),
    app: flags.app({required: true}),
    remote: flags.remote(),
  };

  static args = {
    database: Args.string({description: 'The config var exposed to the owning app containing the database configuration.'}),
  };

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(RepairDefault)
    const {app, confirm} = flags
    const {database} = args
    const db = await getAddon(this.heroku, app, database)
    if (essentialPlan(db))
      throw new Error("You can't perform this operation on Essential-tier databases.")
    await confirmCommand(app, confirm, heredoc(`
      Destructive Action
      Ownership of all database objects owned by additional credentials will be transferred to the default credential.
      This command will also grant the default credential admin option for all additional credentials.
    `))
    ux.action.start('Resetting permissions and object ownership for default role to factory settings')
    await this.heroku.post(`/postgres/v0/databases/${db.name}/repair-default`, {hostname: pgHost()})
    ux.action.stop()
  }
}
