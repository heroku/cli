/*
import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import {arbitraryAppDB} from '../../../lib/pg/fetcher'
import {utils} from '@heroku/heroku-cli-util'
import {TransferSchedule} from '../../../lib/pg/types'
import {nls} from '../../../nls'

export default class Unschedule extends Command {
  static topic = 'pg';
  static description = 'stop daily backups';
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  };

  static args = {
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:arbitrary:suffix')}`}),
  };

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Unschedule)
    const {app} = flags
    const {database} = args
    let db = database
    if (!db) {
      const appDB = await arbitraryAppDB(this.heroku, app)
      const {body: schedules} = await this.heroku.get<TransferSchedule[]>(
        `/client/v11/databases/${appDB.id}/transfer-schedules`,
        {hostname: utils.pg.host()},
      )
      if (schedules.length === 0)
        throw new Error(`No schedules on ${color.app(app)}`)
      if (schedules.length > 1) {
        throw new Error(`Specify schedule on ${color.app(app)}. Existing schedules: ${schedules.map(s => color.green(s.name))
          .join(', ')}`)
      }

      db = schedules[0].name
    }

    ux.action.start(`Unscheduling ${color.green(db)} daily backups`)
    const dbResolver = new utils.pg.DatabaseResolver(this.heroku)
    const {addon} = await dbResolver.getAttachment(app, db)
    const {body: schedules} = await this.heroku.get<TransferSchedule[]>(
      `/client/v11/databases/${addon.id}/transfer-schedules`,
      {hostname: utils.pg.host()},
    )
    const schedule = schedules.find(s => s.name.match(new RegExp(`${db}`, 'i')))
    if (!schedule)
      throw new Error(`No daily backups found for ${color.yellow(addon.name)}`)
    await this.heroku.delete(
      `/client/v11/databases/${addon.id}/transfer-schedules/${schedule.uuid}`,
      {hostname: utils.pg.host()},
    )
    ux.action.stop()
  }
}
*/
