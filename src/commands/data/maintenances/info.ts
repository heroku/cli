import {Command, flags} from '@heroku-cli/command'
import {color, hux, utils} from '@heroku/heroku-cli-util'
import {HerokuSDK} from '@heroku/sdk'
import {MaintenanceInfoResult} from '@heroku/types/data'
import {Args, ux} from '@oclif/core'

import {lazyModuleLoader} from '../../../lib/lazy-module-loader.js'

type StyledMaintenance = Record<string, any> & {
  duration_approximate?: string;
}

export default class DataMaintenancesInfo extends Command {
  static args = {
    addon: Args.string({
      description: 'data addon to show maintenance for',
      required: true,
    }),
  }
  static description = 'display details of the most recent maintenance for an addon'
  static examples = [
    '$ heroku data:maintenances:info postgresql-sinuous-83720',
    '$ heroku data:maintenances:info postgresql-sinuous-83720 --json',
    '$ heroku data:maintenances:info DATABASE --app test-app',
  ]
  static flags = {
    app: flags.app({description: 'app to list addon maintenances for'}),
    json: flags.boolean({char: 'j', description: 'output result in json'}),
    remote: flags.remote(),
  }

  // a prettier display of the information
  protected createStyledMaintenance(maintenance: MaintenanceInfoResult, addSeconds: any, formatDistance: any) {
    // make a copy of the maintenance, omitting uuids for display
    const {uuid: _appUuid, ...appWithoutUuid} = maintenance.app
    const {uuid: _addonUuid, ...addonWithoutUuid} = maintenance.addon

    const styledMaintenance: StyledMaintenance = {
      ...maintenance,
      addon: addonWithoutUuid,
      app: appWithoutUuid,
    };

    ['app',  'addon'].forEach((key: string) => {
      for (const childKey of Object.keys(styledMaintenance[key])) {
        const composedKey = `${key}_${childKey}`
        const childValue = styledMaintenance[key][childKey]

        if (childValue !== undefined) {
          styledMaintenance[composedKey] = childValue
        }
      }

      // after flattening the child keys from `key`, we can remove `key`
      // off the of object so that it isn't shown
      delete styledMaintenance[key]
    })

    if (maintenance.duration_seconds) {
      const startDuration = Date.now()
      const endDuration = addSeconds(startDuration, Number(maintenance.duration_seconds!))
      styledMaintenance.duration_approximate = `~ ${formatDistance(endDuration, startDuration)}`
    }

    return styledMaintenance
  }

  // create new maintenance-ish object for the purpose of
  async run() {
    const {addSeconds, formatDistance} = await lazyModuleLoader.loadDateFns()

    const {args, flags} = await this.parse(DataMaintenancesInfo)
    const addonResolver = new utils.AddonResolver(this.heroku)
    const {app, json} = flags
    const addon = await addonResolver.resolve(args.addon, app)

    ux.action.start(`Fetching maintenance for ${color.addon(addon.name!)}`)
    const {data} = new HerokuSDK()
    let maintenance: MaintenanceInfoResult
    try {
      maintenance = await data.maintenance.info(addon.id!)
    } catch (error: any) {
      ux.action.stop()
      if (error.statusCode === 404) {
        this.error('no maintenance found for this add-on')
      }

      throw error
    }

    ux.action.stop()

    if (json) {
      hux.styledJSON(maintenance)
    } else {
      const styledMaintenance = this.createStyledMaintenance(maintenance, addSeconds, formatDistance)
      hux.styledObject(styledMaintenance)
    }
  }
}
