import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {cli} from 'cli-ux'
import * as _ from 'lodash'

export default class Regions extends Command {
  static topic = 'regions'
  static description = 'list available regions for deployment'
  static flags = {
    json: flags.boolean({description: 'output in json format'}),
    private: flags.boolean({description: 'show regions for private spaces'}),
    common: flags.boolean({description: 'show regions for common runtime'})
  }

  async run() {
    const {flags} = this.parse(Regions)
    let {body: regions} = await this.heroku.get('/regions')
    if (flags.private) {
      regions = regions.filter((region: any) => region.private_capable)
    } else if (flags.common) {
      regions = regions.filter((region: any) => !region.private_capable)
    }
    regions = _.sortBy(regions, ['private_capable', 'name'])

    if (flags.json) {
      cli.styledJSON(regions)
    } else {
      cli.table(regions, {
        columns: [
          {key: 'name', label: 'ID', format: (n: any) => color.green(n)},
          {key: 'description', label: 'Location'},
          {key: 'private_capable', label: 'Runtime', format: (c: any) => c ? 'Private Spaces' : 'Common Runtime'}
        ]
      })
    }
  }
}
