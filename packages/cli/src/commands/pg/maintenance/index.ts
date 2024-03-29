import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import {getAddon} from '../../../lib/pg/fetcher'
import {essentialPlan} from '../../../lib/pg/util'
import pgHost from '../../../lib/pg/host'
import {MaintenanceApiResponse} from '../../../lib/pg/types'

export default class Index extends Command {
  static topic = 'pg';
  static description = 'show current maintenance information';
  static flags = {
    app: flags.app({required: true}),
  };

  static args = {
    database: Args.string(),
  };

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Index)
    const {app} = flags
    const {database} = args
    const db = await getAddon(this.heroku, app, database)
    if (essentialPlan(db))
      ux.error("pg:maintenance isn't available for Essential-tier databases.")
    const {body: info} = await this.heroku.get<MaintenanceApiResponse>(`/client/v11/databases/${db.id}/maintenance`, {hostname: pgHost()})
    ux.log(info.message)
  }
}
