import {color, hux, utils} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'

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
    const dbResolver = new utils.pg.DatabaseResolver(this.heroku)
    const db = await dbResolver.getArbitraryLegacyDB(app)
    const {body: schedules} = await this.heroku.get<TransferSchedule[]>(`/client/v11/databases/${db.id}/transfer-schedules`, {hostname: utils.pg.host()})
    if (schedules.length === 0) {
      ux.warn(`No backup schedules found on ${color.app(app)}\nUse ${color.cyan.bold('heroku pg:backups:schedule')} to set one up`)
    } else {
      hux.styledHeader('Backup Schedules')
      for (const s of schedules) {
        ux.stdout(`${color.green(s.name)}: daily at ${s.hour}:00 ${s.timezone}\n`)
      }
    }
  }
}

