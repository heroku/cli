import {color, utils} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Args, ux} from '@oclif/core'

import {MaintenanceApiResponse} from '../../../lib/pg/types.js'
import {essentialPlan} from '../../../lib/pg/util.js'
import {nls} from '../../../nls.js'

export default class Run extends Command {
  static args = {
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`}),
  }

  static deprecationOptions = {
    message: 'The pg:maintenance:run command has been deprecated and will be removed in version 11. Use data:maintenances:run from the data-maintenance plugin instead.',
  }

  static description = 'start maintenance'

  static flags = {
    app: flags.app({required: true}),
    force: flags.boolean({char: 'f'}),
    remote: flags.remote(),
  }

  static status = 'deprecated'
  static topic = 'pg'

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Run)
    const {app, force} = flags
    const {database} = args
    const dbResolver = new utils.pg.DatabaseResolver(this.heroku)
    const {addon: db} = await dbResolver.getAttachment(app, database)
    if (essentialPlan(db))
      ux.error("pg:maintenance isn't available for Essential-tier databases.")
    ux.action.start(`Starting maintenance for ${color.datastore(db.name)}`)
    if (!force) {
      const {body: appInfo} = await this.heroku.get<Heroku.App>(`/apps/${app}`)
      if (!appInfo.maintenance)
        ux.error('Application must be in maintenance mode or run with --force')
    }

    const {body: response} = await this.heroku.post<MaintenanceApiResponse>(`/client/v11/databases/${db.id}/maintenance`, {hostname: utils.pg.host()})
    ux.action.stop(response.message || 'done')
  }
}
