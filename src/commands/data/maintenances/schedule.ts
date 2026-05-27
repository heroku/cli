import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {color, utils} from '@heroku/heroku-cli-util'
import {HerokuSDK} from '@heroku/sdk'
import {Args, ux} from '@oclif/core'

import {Maintenance} from '../../../lib/data/types.js'
import {lazyModuleLoader} from '../../../lib/lazy-module-loader.js'

export default class DataMaintenancesSchedule extends Command {
  static args = {
    addon: Args.string({
      description: 'addon to schedule or re-schedule maintenance for',
      required: true,
    }),
  }
  static description = 'schedule or re-schedule maintenance for an add-on'
  static examples = [
    '$ heroku data:maintenances:schedule postgresql-sinuous-83910',
    '$ heroku data:maintenances:schedule postgresql-sinuous-83910 --weeks 3',
    '$ heroku data:maintenances:schedule postgresql-sinuous-83910 --weeks -2',
    '$ heroku data:maintenances:schedule postgresql-sinuous-83910 --week 2020-02-23',
    '$ heroku data:maintenances:schedule HEROKU_POSTGRESQL_RED --app test-app',
  ]
  static flags = {
    app: flags.app(),
    remote: flags.remote(),
    week: flags.string({
      description: 'desired week to run maintenance in',
      exclusive: ['weeks'],
    }),
    weeks: flags.string({
      default: '2',
      description: 'the number of weeks to delay maintenance for',
      exclusive: ['week'],
    }),
  }

  protected async computeDelayWeeks(addon: Heroku.AddOn, week: string, differenceInCalendarWeeks: any) {
    const {data} = new HerokuSDK()
    const maintenance = await data.maintenance.info(addon.id!) as unknown as Maintenance

    const scheduled = (maintenance.status === 'completed' || maintenance.scheduled_for === null)
      ? Date.now()
      : Date.parse(maintenance.scheduled_for)

    const weeks = differenceInCalendarWeeks(
      Date.parse(week),
      scheduled,
    )

    return weeks.toString()
  }

  async run() {
    const {differenceInCalendarWeeks} = await lazyModuleLoader.loadDateFns()

    const {args, flags} = await this.parse(DataMaintenancesSchedule)
    const addonResolver = new utils.AddonResolver(this.heroku)
    const {app, week, weeks} = flags

    const addon = await addonResolver.resolve(args.addon, app)

    const delayWeeks = week === undefined
      ? weeks
      : await this.computeDelayWeeks(addon, week, differenceInCalendarWeeks)

    await this.scheduleMaintenance(addon, delayWeeks)
  }

  protected async scheduleMaintenance(addon: Heroku.AddOn, delayWeeks: string) {
    ux.action.start(`Scheduling maintenance for ${color.addon(addon.name!)}`)
    const {data} = new HerokuSDK()
    const schedule = await data.maintenance.schedule(addon.id!, {delay_weeks: delayWeeks}) as unknown as Maintenance
    ux.action.stop('maintenance scheduled')

    const alreadyScheduled = schedule.previously_scheduled_for !== null

    if (alreadyScheduled) {
      this.log(`Scheduled maintenance for ${color.addon(addon.name!)} changed from ${schedule.previously_scheduled_for} to ${schedule.scheduled_for}`)
    } else {
      this.log(`Maintenance for ${color.addon(addon.name!)} scheduled for ${schedule.scheduled_for}`)
    }
  }
}
