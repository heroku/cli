import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import {utils} from '@heroku/heroku-cli-util'
import {essentialPlan} from '../../../lib/pg/util'
import {MaintenanceApiResponse} from '../../../lib/pg/types'
import {nls} from '../../../nls'

export default class Index extends Command {
  static topic = 'pg';
  static description = 'show current maintenance information';
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  static args = {
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`}),
  }

  static status = 'deprecated'

  static deprecationOptions = {
    message: 'The pg:maintenance command has been deprecated and will be removed in version 11. Use data:maintenances from the data-maintenance plugin instead.',
  }

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Index)
    const {app} = flags
    const {database} = args
    const dbResolver = new utils.pg.DatabaseResolver(this.heroku)
    const {addon: db} = await dbResolver.getAttachment(app, database)
    if (essentialPlan(db))
      ux.error('pg:maintenance isn’t available for Essential-tier databases.')
    const {body: info} = await this.heroku.get<MaintenanceApiResponse>(`/client/v11/databases/${db.id}/maintenance`, {hostname: utils.pg.host()})
    ux.log(info.message)
  }
}
