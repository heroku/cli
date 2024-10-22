import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import {arbitraryAppDB, getAddon} from '../../../lib/pg/fetcher'
import {TransferSchedule} from '../../../lib/pg/types'
import pgHost from '../../../lib/pg/host'

export default class Unschedule extends Command {
  static topic = 'pg';
  static description = 'stop daily backups';
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  };

  static args = {
    database: Args.string({description: 'globally unique name or ID of the database attachment. If omitted, we use an arbitrary postgres database.'}),
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
        {hostname: pgHost()},
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
    const addon = await getAddon(this.heroku, app, db)
    const {body: schedules} = await this.heroku.get<TransferSchedule[]>(
      `/client/v11/databases/${addon.id}/transfer-schedules`,
      {hostname: pgHost()},
    )
    const schedule = schedules.find(s => s.name.match(new RegExp(`${db}`, 'i')))
    if (!schedule)
      throw new Error(`No daily backups found for ${color.yellow(addon.name)}`)
    await this.heroku.delete(
      `/client/v11/databases/${addon.id}/transfer-schedules/${schedule.uuid}`,
      {hostname: pgHost()},
    )
    ux.action.stop()
  }
}
