import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import {hux} from '@heroku/heroku-cli-util'
import {utils} from '@heroku/heroku-cli-util'
import {arbitraryAppDB} from '../../../lib/pg/fetcher'
import type {TransferSchedule} from '../../../lib/pg/types'

export default class Schedules extends Command {
  static topic = 'pg';
  static description = 'list backup schedule';
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  };

  public async run(): Promise<void> {
    const {flags} = await this.parse(Schedules)
    const {app} = flags
    const db = await arbitraryAppDB(this.heroku, app)
    const {body: schedules} = await this.heroku.get<TransferSchedule[]>(`/client/v11/databases/${db.id}/transfer-schedules`, {hostname: utils.pg.host()})
    if (schedules.length === 0) {
      ux.warn(`No backup schedules found on ${color.app(app)}\nUse ${color.cyan.bold('heroku pg:backups:schedule')} to set one up`)
    } else {
      hux.styledHeader('Backup Schedules')
      for (const s of schedules) {
        ux.log(`${color.green(s.name)}: daily at ${s.hour}:00 ${s.timezone}`)
      }
    }
  }
}
