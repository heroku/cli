import type {Region} from '@heroku/types/3.sdk'

import {Command, flags} from '@heroku-cli/command'
import {color, hux} from '@heroku/heroku-cli-util'

import {createSDK} from '../lib/sdk.js'

export default class Regions extends Command {
  static description = 'list available regions for deployment'
  static enableJsonFlag = true
  static flags = {
    common: flags.boolean({description: 'show regions for common runtime'}),
    private: flags.boolean({description: 'show regions for private spaces'}),
  }
  static topic = 'regions'

  async run(): Promise<Region[]> {
    const {platform} = createSDK(this.heroku)
    const {flags} = await this.parse(Regions)
    let regions = await platform.region.list()
    if (flags.private) {
      regions = regions.filter(region => region.private_capable)
    } else if (flags.common) {
      regions = regions.filter(region => !region.private_capable)
    }

    if (!this.jsonEnabled()) {
      // Display-only ordering: sort a copy so --json returns the SDK result unchanged (API order).
      const sorted = [...regions].sort((a, b) => {
        if (a.private_capable !== b.private_capable) {
          return a.private_capable ? 1 : -1
        }

        return a.name.localeCompare(b.name)
      })

      const rows = sorted.map(({description, name, private_capable}) => ({
        description,
        name: color.name(name),
        runtime: private_capable ? 'Private Spaces' : 'Common Runtime',
      }))

      /* eslint-disable perfectionist/sort-objects */
      this.log(hux.table(rows, {
        name: {header: 'ID'},
        description: {header: 'Location'},
        runtime: {header: 'Runtime'},
      }))
      /* eslint-enable perfectionist/sort-objects */
    }

    return regions
  }
}
