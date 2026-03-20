import {Command, flags} from '@heroku-cli/command'
import {color} from '@heroku/heroku-cli-util'
import * as pg from '@heroku/heroku-cli-util/utils/pg'
import {HTTPError} from '@heroku/http-call'
import {Args, ux} from '@oclif/core'

import {PgDatabase} from '../../../lib/pg/types.js'
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

    const schedule = this.parseDate(flags.at)
    const dbResolver = new pg.DatabaseResolver(this.heroku)
    const attachment = await dbResolver.getAttachment(app, database)
    const {addon: db, name} = attachment
    const at = color.cyan(`${schedule.hour}:00 ${schedule.timezone}`)

    const pgResponse = await this.heroku.get<PgDatabase>(`/client/v11/databases/${db.id}`, {hostname: pg.getHost()})
      .catch((error: HTTPError) => {
        if (error.statusCode !== 404)
          throw error
        ux.error(`${color.datastore(db.name)} is not yet provisioned.\nRun ${color.cyan.bold('heroku addons:wait')} to wait until the db is provisioned.`, {exit: 1})
      })
    const {body: dbInfo} = pgResponse || {body: null}
    if (dbInfo) {
      const dbProtected = /On/.test(dbInfo.info.find(attribute => attribute.name === 'Continuous Protection')?.values[0] || '')
      if (dbProtected) {
        ux.warn('Continuous protection is already enabled for this database. Logical backups of large databases are likely to fail.')
        ux.warn('See https://devcenter.heroku.com/articles/heroku-postgres-data-safety-and-continuous-protection#physical-backups-on-heroku-postgres.')
      }
    }

    ux.action.start(`Scheduling automatic daily backups of ${color.datastore(db.name)} at ${at}`)
    schedule.schedule_name = name + '_URL'
    await this.heroku.post(`/client/v11/databases/${db.id}/transfer-schedules`, {
      body: schedule, hostname: pg.getHost(),
    })
    ux.action.stop()
  }
}
