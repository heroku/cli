import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import pgHost from '../../../lib/pg/host'
import {essentialPlan} from '../../../lib/pg/util'
import {getAddon} from '../../../lib/pg/fetcher'
import {MaintenanceApiResponse} from '../../../lib/pg/types'
import heredoc from 'tsheredoc'

export default class Window extends Command {
  static topic = 'pg';
  static description = heredoc(`
    Set weekly maintenance window.
    All times are in UTC.
  `);

  static example = '$ heroku pg:maintenance:window "Sunday 06:00" postgres-slippery-100';

  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  };

  static args = {
    window: Args.string({required: true, description: 'timestamp of the maintenance window.'}),
    database: Args.string({description: 'config var exposed to the owning app containing the database configuration'}),
  };

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Window)
    const {database, window} = args
    const {app} = flags
    const db = await getAddon(this.heroku, app, database)
    if (essentialPlan(db))
      ux.error("pg:maintenance isn't available for Essential-tier databases.")
    if (!window.match(/^[A-Za-z]{2,10} \d\d?:[03]0$/))
      ux.error('Window must be "Day HH:MM" where MM is 00 or 30')

    ux.action.start(`Setting maintenance window for ${color.yellow(db.name)} to ${color.cyan(window)}`)
    const {body: response} = await this.heroku.put<MaintenanceApiResponse>(
      `/client/v11/databases/${db.id}/maintenance_window`,
      {
        body: {description: window}, hostname: pgHost(),
      },
    )
    ux.action.stop(response.message || 'done')
  }
}
