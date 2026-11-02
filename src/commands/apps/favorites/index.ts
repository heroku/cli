import {Command, flags} from '@heroku-cli/command'
import {color, hux} from '@heroku/heroku-cli-util'
import {ux} from '@oclif/core/ux'

import {createSDK} from '../../../lib/sdk.js'

export default class Index extends Command {
  static description = 'list favorited apps'
  static flags  = {
    json: flags.boolean({char: 'j', description: 'output in json format'}),
  }
  static topic = 'apps'

  async run() {
    const {flags} = await this.parse(Index)
    const sdk = createSDK(this.heroku)
    const favorites = await sdk.dashboardBackend.favorite.list({type: 'app'})

    if (flags.json) {
      ux.stdout(JSON.stringify(favorites, null, 2))
    } else {
      hux.styledHeader('Favorited Apps')
      for (const f of favorites) {
        ux.stdout(color.app(f.resource_name))
      }
    }
  }
}
