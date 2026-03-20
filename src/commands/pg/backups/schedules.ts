import {Command, flags} from '@heroku-cli/command'
import {color, hux} from '@heroku/heroku-cli-util'
import * as pg from '@heroku/heroku-cli-util/utils/pg'
import {ux} from '@oclif/core/ux'

import type {TransferSchedule} from '../../../lib/pg/types.js'

export default class Schedules extends Command {
  static description = 'list backup schedule'
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  static topic = 'pg'

  public async run(): Promise<void> {
    const {flags} = await this.parse(Schedules)
    const {app} = flags
    const dbResolver = new pg.DatabaseResolver(this.heroku)
    const db = await dbResolver.getArbitraryLegacyDB(app)
    const {body: schedules} = await this.heroku.get<TransferSchedule[]>(`/client/v11/databases/${db.id}/transfer-schedules`, {hostname: pg.getHost()})
    if (schedules.length === 0) {
      ux.warn(`No backup schedules found on ${color.app(app)}\nUse ${color.code('heroku pg:backups:schedule')} to set one up`)
    } else {
      hux.styledHeader('Backup Schedules')
      for (const s of schedules) {
        ux.stdout(`${color.name(s.name)}: daily at ${s.hour}:00 ${s.timezone}\n`)
      }
    }
  }
}
