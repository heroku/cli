import {Command, flags} from '@heroku-cli/command'
import {color} from '@heroku/heroku-cli-util'
import {HerokuSDK} from '@heroku/sdk'
import {transferScheduleExtensions} from '@heroku/sdk/extensions/data'
import {Args, ux} from '@oclif/core'

import {nls} from '../../../nls.js'

export default class Unschedule extends Command {
  static args = {
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:arbitrary:suffix')}`}),
  }
  static description = 'stop daily backups'
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }
  static topic = 'pg'

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Unschedule)
    const {app} = flags
    const {database} = args
    const {data} = new HerokuSDK({extensions: [transferScheduleExtensions]})

    const schedules = await data.transferSchedule.list(app)
    let db = database
    if (!db) {
      if (schedules.length === 0)
        throw new Error(`No schedules on ${color.app(app)}`)
      if (schedules.length > 1) {
        throw new Error(`Specify schedule on ${color.app(app)}. Existing schedules: ${schedules.map(s => color.datastore(s.name))
          .join(', ')}`)
      }

      db = schedules[0].name
    }

    ux.action.start(`Unscheduling ${color.datastore(db)} daily backups`)
    const schedule = schedules.find(s => s.name.match(new RegExp(`${db}`, 'i')))
    if (!schedule)
      throw new Error(`No daily backups found for ${color.datastore(db)}`)
    await data.transferSchedule.delete(app, db, schedule.uuid)
    ux.action.stop()
  }
}
