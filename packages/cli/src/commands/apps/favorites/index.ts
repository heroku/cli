import {ux} from '@oclif/core'
import {Command, flags} from '@heroku-cli/command'
import {Favorites} from '../../../lib/types/favorites'

export default class Index extends Command {
  static description = 'list favorited apps'
  static topic = 'apps'
  static flags  = {
    json: flags.boolean({char: 'j', description: 'output in json format'}),
  }

  async run() {
    const {flags} = await this.parse(Index)

    const {body: favorites} = await this.heroku.get<Favorites>(
      '/favorites?type=app',
      {hostname: 'particleboard.heroku.com'},
    )

    if (flags.json) {
      ux.styledJSON(favorites)
    } else {
      ux.styledHeader('Favorited Apps')
      for (const f of favorites) {
        ux.log(f.resource_name)
      }
    }
  }
}
