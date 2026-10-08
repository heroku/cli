import {Command, flags} from '@heroku-cli/command'
import {color} from '@heroku/heroku-cli-util'
import {NotFoundError} from '@heroku/heroku-fetch'
import {HerokuSDK} from '@heroku/sdk'
import {databaseExtensions, transferScheduleExtensions} from '@heroku/sdk/extensions/data'
import {Args, ux} from '@oclif/core'

import {nls} from '../../../nls.js'

type Timezone = {
  BST: string
  CDT: string
  CEST: string
  CET: string
  CST: string
  EDT: string
  EST: string
  GMT: string
  MDT: string
  MST: string
  PDT: string
  PST: string
  Z: string
}

const TZ: Timezone = {
  BST: 'Europe/London',
  CDT: 'America/Chicago',
  CEST: 'Europe/Paris',
  CET: 'Europe/Paris',
  CST: 'America/Chicago',
  EDT: 'America/New_York',
  EST: 'America/New_York',
  GMT: 'Europe/London',
  MDT: 'America/Boise',
  MST: 'America/Boise',
  PDT: 'America/Los_Angeles',
  PST: 'America/Los_Angeles',
  Z: 'UTC',
}

type BackupSchedule = {
  hour: string
  schedule_name?: string
  timezone: string
}

export default class Schedule extends Command {
  static args = {
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`}),
  }
  static description = 'schedule daily backups for given database'
  static flags = {
    app: flags.app({required: true}),
    at: flags.string({description: "at a specific (24h) hour in the given timezone. Defaults to UTC. --at '[HOUR]:00 [TIMEZONE]'", required: true}),
    remote: flags.remote(),
  }
  static topic = 'pg'
  parseDate = function (at: string): BackupSchedule {
    const m = at.match(/^(0?\d|1\d|2[0-3]):00 ?(\S*)$/)

    if (m) {
      const [, hour, timezone] = m
      return {hour, timezone: TZ[timezone.toUpperCase() as keyof Timezone] || timezone || 'UTC'}
    }

    return ux.error("Invalid schedule format: expected --at '[HOUR]:00 [TIMEZONE]'", {exit: 1})
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Schedule)
    const {app} = flags
    const {database} = args
    const {data} = new HerokuSDK({extensions: [databaseExtensions, transferScheduleExtensions]})

    const schedule = this.parseDate(flags.at)
    const at = color.cyan(`${schedule.hour}:00 ${schedule.timezone}`)

    const dbInfo = await data.database.describe(app, database)
      .catch(error => {
        if (!(error instanceof NotFoundError))
          throw error
        ux.error(`${color.datastore(database ?? 'DATABASE_URL')} is not yet provisioned.\nRun ${color.code('heroku addons:wait')} to wait until the db is provisioned.`, {exit: 1})
      })

    const dbProtected = /On/.test(String(dbInfo.info?.find(attribute => attribute.name === 'Continuous Protection')?.values?.[0]))
    if (dbProtected) {
      ux.warn('Continuous protection is already enabled for this database. Logical backups of large databases are likely to fail.')
      ux.warn('See https://devcenter.heroku.com/articles/heroku-postgres-data-safety-and-continuous-protection#physical-backups-on-heroku-postgres.')
    }

    ux.action.start(`Scheduling automatic daily backups of ${color.datastore(dbInfo.name ?? database ?? 'DATABASE_URL')} at ${at}`)
    await data.transferSchedule.create(app, database, {
      hour: Number.parseInt(schedule.hour, 10),
      timezone: schedule.timezone,
      // schedule_name is added in the SDK
    })
    ux.action.stop()
  }
}
