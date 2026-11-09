import {Command, flags} from '@heroku-cli/command'
import {color} from '@heroku/heroku-cli-util'
import {maintenanceExtensions} from '@heroku/sdk/extensions/data'
import {Args, ux} from '@oclif/core'

import {lazyModuleLoader} from '../../../lib/lazy-module-loader.js'
import {createSDK} from '../../../lib/sdk.js'

type Data = ReturnType<typeof createSDK<readonly [typeof maintenanceExtensions]>>['data']

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
    weeks: flags.integer({
      default: 2,
      description: 'the number of weeks to delay maintenance for',
      exclusive: ['week'],
    }),
  }

  protected async computeDelayWeeks(data: Data, addon: string, app: string | undefined, week: string, differenceInCalendarWeeks: any) {
    const {maintenance} = await data.maintenance.info(addon, {appIdentity: app})

    const scheduled = (maintenance.status === 'completed' || !maintenance.scheduled_for)
      ? Date.now()
      : Date.parse(maintenance.scheduled_for)

    return differenceInCalendarWeeks(
      Date.parse(week),
      scheduled,
    )
  }

  async run() {
    const {differenceInCalendarWeeks} = await lazyModuleLoader.loadDateFns()

    const {args, flags} = await this.parse(DataMaintenancesSchedule)
    const {app, week, weeks} = flags

    const {data} = createSDK(this.heroku, {extensions: [maintenanceExtensions]})

    const delayWeeks = week === undefined
      ? weeks
      : await this.computeDelayWeeks(data, args.addon, app, week, differenceInCalendarWeeks)

    await this.scheduleMaintenance(data, args.addon, app, delayWeeks)
  }

  protected async scheduleMaintenance(data: Data, addon: string, app: string | undefined, delayWeeks: number) {
    const {addon: resolvedAddon, schedule} = await data.maintenance.schedule(addon, {delay_weeks: delayWeeks}, {
      appIdentity: app,
      beforeSchedule({addon}) {
        ux.action.start(`Scheduling maintenance for ${color.addon(addon.name)}`)
      },
    })
    ux.action.stop('maintenance scheduled')

    const alreadyScheduled = Boolean(schedule.previously_scheduled_for)

    if (alreadyScheduled) {
      this.log(`Scheduled maintenance for ${color.addon(resolvedAddon.name)} changed from ${schedule.previously_scheduled_for} to ${schedule.scheduled_for}`)
    } else {
      this.log(`Maintenance for ${color.addon(resolvedAddon.name)} scheduled for ${schedule.scheduled_for}`)
    }
  }
}
