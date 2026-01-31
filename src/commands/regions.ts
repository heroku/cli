import {color, hux} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'

export default class Regions extends Command {
  static description = 'list available regions for deployment'

  static flags = {
    common: flags.boolean({description: 'show regions for common runtime'}),
    json: flags.boolean({description: 'output in json format'}),
    private: flags.boolean({description: 'show regions for private spaces'}),
  }

  static topic = 'regions'

  async run() {
    const {flags} = await this.parse(Regions)
    let {body: regions} = await this.heroku.get<Heroku.Region[]>('/regions')
    if (flags.private) {
      regions = regions.filter((region: any) => region.private_capable)
    } else if (flags.common) {
      regions = regions.filter((region: any) => !region.private_capable)
    }

    regions = regions.sort((a, b) => {
      if (a.private_capable !== b.private_capable) {
        return a.private_capable ? 1 : -1
      }

      return (a.name ?? '').localeCompare(b.name ?? '')
    })

    if (flags.json) {
      hux.styledJSON(regions)
    } else {
      /* eslint-disable perfectionist/sort-objects */
      hux.table(regions, {
        name: {
          header: 'ID',
          get: ({name}: any) => color.name(name),
        },
        description: {
          header: 'Location',
        },
        private_capable: {
          header: 'Runtime',
          get: ({private_capable}: any) => private_capable ? 'Private Spaces' : 'Common Runtime',
        },
      })
      /* eslint-enable perfectionist/sort-objects */
    }
  }
}
