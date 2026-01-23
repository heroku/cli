import {color, utils} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import {MaintenanceApiResponse} from '../../../lib/pg/types.js'
import {essentialPlan} from '../../../lib/pg/util.js'
const heredoc = tsheredoc.default
import {nls} from '../../../nls.js'

export default class Window extends Command {
  /* eslint-disable perfectionist/sort-objects */
  static args = {
    window: Args.string({description: 'timestamp of the maintenance window', required: true}),
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`}),
  }
  /* eslint-enable perfectionist/sort-objects */

  static description = heredoc(`
    Set weekly maintenance window.
    All times are in UTC.
  `)

  static example = `${color.command('heroku pg:maintenance:window "Sunday 06:00" postgres-slippery-100')}`

  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  static topic = 'pg'

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Window)
    const {database, window} = args
    const {app} = flags
    const dbResolver = new utils.pg.DatabaseResolver(this.heroku)
    const {addon: db} = await dbResolver.getAttachment(app, database)
    if (essentialPlan(db))
      ux.error("pg:maintenance isn't available for Essential-tier databases.")
    if (!window.match(/^[A-Za-z]{2,10} \d\d?:[03]0$/))
      ux.error('Window must be "Day HH:MM" where MM is 00 or 30')

    ux.action.start(`Setting maintenance window for ${color.datastore(db.name)} to ${color.info(window)}`)
    const {body: response} = await this.heroku.put<MaintenanceApiResponse>(
      `/client/v11/databases/${db.id}/maintenance_window`,
      {
        body: {description: window}, hostname: utils.pg.host(),
      },
    )
    ux.action.stop(response.message || 'done')
  }
}
