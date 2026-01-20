import {color, utils} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import {PgDatabase} from '../../../lib/pg/types.js'
import {HTTPError} from '@heroku/http-call'
import {nls} from '../../../nls.js'

type Timezone = {
  PST: string
  PDT: string
  MST: string
  MDT: string
  CST: string
  CDT: string
  EST: string
  EDT: string
  Z: string
  GMT: string
  BST: string
  CET: string
  CEST: string
}

const TZ: Timezone = {
  PST: 'America/Los_Angeles',
  PDT: 'America/Los_Angeles',
  MST: 'America/Boise',
  MDT: 'America/Boise',
  CST: 'America/Chicago',
  CDT: 'America/Chicago',
  EST: 'America/New_York',
  EDT: 'America/New_York',
  Z: 'UTC',
  GMT: 'Europe/London',
  BST: 'Europe/London',
  CET: 'Europe/Paris',
  CEST: 'Europe/Paris',
}

type BackupSchedule = {
  hour: string
  timezone: string
  schedule_name?: string
}

export default class Schedule extends Command {
  static topic = 'pg'
  static description = 'schedule daily backups for given database'
  static flags = {
    at: flags.string({required: true, description: "at a specific (24h) hour in the given timezone. Defaults to UTC. --at '[HOUR]:00 [TIMEZONE]'"}),
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  static args = {
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`}),
  }

  parseDate = function (at: string): BackupSchedule {
    const m = at.match(/^(0?\d|1\d|2[0-3]):00 ?(\S*)$/)

    if (m) {
      const [, hour, timezone] = m
      return {hour, timezone: TZ[timezone.toUpperCase() as keyof Timezone] || timezone || 'UTC'}
    }

    return ux.error("Invalid schedule format: expected --at '[HOUR]:00 [TIMEZONE]'", {exit: 1})
  }

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Schedule)
    const {app} = flags
    const {database} = args

    const schedule = this.parseDate(flags.at)
    const dbResolver = new utils.pg.DatabaseResolver(this.heroku)
    const attachment = await dbResolver.getAttachment(app, database)
    const {addon: db, name} = attachment
    const at = color.cyan(`${schedule.hour}:00 ${schedule.timezone}`)

    const pgResponse = await this.heroku.get<PgDatabase>(`/client/v11/databases/${db.id}`, {hostname: utils.pg.host()})
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
      body: schedule, hostname: utils.pg.host(),
    })
    ux.action.stop()
  }
}

