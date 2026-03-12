import {color, hux} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'

import {Favorites} from '../../../lib/types/favorites.js'

export default class Index extends Command {
  static description = 'list favorited apps'
  static flags  = {
    json: flags.boolean({char: 'j', description: 'output in json format'}),
  }

  static topic = 'apps'

  async run() {
    const {flags} = await this.parse(Index)

    const {body: favorites} = await this.heroku.get<Favorites>(
      '/favorites?type=app',
      {hostname: 'particleboard.heroku.com'},
    )

    if (flags.json) {
      hux.styledJSON(favorites)
    } else {
      hux.styledHeader('Favorited Apps')
      for (const f of favorites) {
        ux.stdout(color.app(f.resource_name))
      }
    }
  }
}
