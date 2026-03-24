import {color, hux, utils} from '@heroku/heroku-cli-util'
import {flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import {addSeconds, formatDistance} from 'date-fns'

import BaseCommand from '../../../lib/data/baseCommand.js'
import {Maintenance} from '../../../lib/data/types.js'

interface StyledMaintenance extends Maintenance {
  [key: string]: any;
  duration_approximate?: string;
}

export default class DataMaintenancesInfo extends BaseCommand {
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
  protected createStyledMaintenance(maintenance: Maintenance) {
    // make a copy of the maintenance
    const styledMaintenance: StyledMaintenance = {
      ...maintenance,
      addon: {
        ...maintenance.addon,
      },
      app: {
        ...maintenance.app,
      },
    }

    // remove app uuid
    if (styledMaintenance.app && styledMaintenance.app.uuid) {
      delete styledMaintenance.app.uuid
    }

    // remove addon uuid
    if (styledMaintenance.addon && styledMaintenance.addon.uuid) {
      delete styledMaintenance.addon.uuid
    }

    ['app',  'addon'].forEach((key: string) => {
      Object.keys(styledMaintenance[key]).forEach(childKey => {
        const composedKey = `${key}_${childKey}`
        const childValue = styledMaintenance[key][childKey]

        if (childValue !== undefined) {
          styledMaintenance[composedKey] = childValue
        }
      })

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
    const {args, flags} = await this.parse(DataMaintenancesInfo)
    const addonResolver = new utils.AddonResolver(this.heroku)
    const {app, json} = flags
    const addon = await addonResolver.resolve(args.addon, app)

    ux.action.start(`Fetching maintenance for ${color.addon(addon.name!)}`)
    const {body: maintenance} = await this.dataApi.get<Maintenance>(
      `/data/maintenances/v1/${addon!.id}`,
      this.dataApi.defaults,
    )
    ux.action.stop()

    if (json) {
      hux.styledJSON(maintenance)
    } else {
      const styledMaintenance = this.createStyledMaintenance(maintenance)
      hux.styledObject(styledMaintenance)
    }
  }
}
