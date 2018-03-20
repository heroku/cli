// @flow

import {Command, flags} from '@heroku-cli/command'
import {cli} from 'cli-ux'

export default class LabsDisable extends Command {
  static topic = 'regions'
  static description = 'list available regions for deployment'
  static flags = {
    json: flags.boolean({description: 'output in json format'}),
    private: flags.boolean({description: 'show regions for private spaces'}),
    common: flags.boolean({description: 'show regions for common runtime'})
  }

  async run () {
    const sortBy = require('lodash.sortby')

    let {body: regions} = await this.heroku.get('/regions')
    if (this.flags.private) {
      regions = regions.filter(region => region.private_capable)
    } else if (this.flags.common) {
      regions = regions.filter(region => !region.private_capable)
    }
    regions = sortBy(regions, ['private_capable', 'name'])

    if (this.flags.json) {
      cli.styledJSON(regions)
    } else {
      cli.table(regions, {
        columns: [
          {key: 'name', label: 'ID', format: (n) => cli.color.green(n)},
          {key: 'description', label: 'Location'},
          {key: 'private_capable', label: 'Runtime', format: (c) => c ? 'Private Spaces' : 'Common Runtime'}
        ]
      })
    }
  }
}
