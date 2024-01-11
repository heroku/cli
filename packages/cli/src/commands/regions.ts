import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'
import * as _ from 'lodash'

export default class Regions extends Command {
  static topic = 'regions'

  static description = 'list available regions for deployment'

  static flags = {
    json: flags.boolean({description: 'output in json format'}),
    private: flags.boolean({description: 'show regions for private spaces'}),
    common: flags.boolean({description: 'show regions for common runtime'}),
  }

  async run() {
    const {flags} = await this.parse(Regions)
    let {body: regions} = await this.heroku.get<Heroku.Region[]>('/regions')
    if (flags.private) {
      regions = regions.filter((region: any) => region.private_capable)
    } else if (flags.common) {
      regions = regions.filter((region: any) => !region.private_capable)
    }

    regions = _.sortBy(regions, ['private_capable', 'name'])

    if (flags.json) {
      ux.styledJSON(regions)
    } else {
      ux.table(regions, {
        name: {
          header: 'ID',
          get: ({name}: any) => color.green(name),
        },
        description: {
          header: 'Location',
        },
        private_capable: {
          header: 'Runtime',
          get: ({private_capable}: any) => private_capable ? 'Private Spaces' : 'Common Runtime',
        },
      })
    }
  }
}
