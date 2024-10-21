import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import {getAddon} from '../../../lib/pg/fetcher'
import {essentialPlan} from '../../../lib/pg/util'
import pgHost from '../../../lib/pg/host'
import {MaintenanceApiResponse} from '../../../lib/pg/types'
import * as Heroku from '@heroku-cli/schema'

export default class Run extends Command {
  static topic = 'pg'
  static description = 'start maintenance'
  static flags = {
    force: flags.boolean({char: 'f'}),
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  static args = {
    database: Args.string({description: 'The config var exposed to the owning app containing the database configuration.'}),
  }

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Run)
    const {app, force} = flags
    const {database} = args
    const db = await getAddon(this.heroku, app, database)
    if (essentialPlan(db))
      ux.error("pg:maintenance isn't available for Essential-tier databases.")
    ux.action.start(`Starting maintenance for ${color.yellow(db.name)}`)
    if (!force) {
      const {body: appInfo} = await this.heroku.get<Heroku.App>(`/apps/${app}`)
      if (!appInfo.maintenance)
        ux.error('Application must be in maintenance mode or run with --force')
    }

    const {body: response} = await this.heroku.post<MaintenanceApiResponse>(`/client/v11/databases/${db.id}/maintenance`, {hostname: pgHost()})
    ux.action.stop(response.message || 'done')
  }
}
