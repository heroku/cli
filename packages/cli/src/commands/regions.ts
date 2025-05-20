import {color} from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {hux} from '@heroku/heroku-cli-util'

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

    regions = regions.sort((a, b) => {
      if (a.private_capable !== b.private_capable) {
        return a.private_capable ? 1 : -1
      }

      return (a.name ?? '').localeCompare(b.name ?? '')
    })

    // if (flags.json) {
    //   hux.styledJSON(regions)
    // } else {
    //   hux.table(regions, {
    //     name: {
    //       header: 'ID',
    //       get: ({name}: any) => color.green(name),
    //     },
    //     description: {
    //       header: 'Location',
    //     },
    //     private_capable: {
    //       header: 'Runtime',
    //       get: ({private_capable}: any) => private_capable ? 'Private Spaces' : 'Common Runtime',
    //     },
    //   })
    // }
  }
}
