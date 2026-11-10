import {Command, flags} from '@heroku-cli/command'
import {color, hux} from '@heroku/heroku-cli-util'
import {maintenanceExtensions} from '@heroku/sdk/extensions/data'
import {MaintenanceInfoResult} from '@heroku/types/data'
import {Args, ux} from '@oclif/core'

import {lazyModuleLoader} from '../../../lib/lazy-module-loader.js'
import {createSDK} from '../../../lib/sdk.js'

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
    const {app, json} = flags
    const {data} = createSDK(this.heroku, {extensions: [maintenanceExtensions]})

    const {maintenance} = await data.maintenance.info(args.addon, {
      appIdentity: app,
      beforeInfo({addon}) {
        ux.action.start(`Fetching maintenance for ${color.addon(addon.name)}`)
      },
    })

    ux.action.stop()

    if (json) {
      this.logJson(maintenance)
    } else {
      const styledMaintenance = this.createStyledMaintenance(maintenance, addSeconds, formatDistance)
      this.log(hux.styledObject(styledMaintenance))
    }
  }
}
