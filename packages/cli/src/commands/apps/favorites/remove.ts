import {color} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'

import {Favorites} from '../../../lib/types/favorites.js'

export default class Remove extends Command {
  static description = 'unfavorites an app'
  static flags  = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  static topic = 'apps'

  async run() {
    const {flags} = await this.parse(Remove)
    const {app} = flags

    ux.action.start(`Removing ${color.app(app)} from favorites`)

    const {body: favorites} = await this.heroku.get<Favorites>(
      '/favorites?type=app',
      {hostname: 'particleboard.heroku.com'},
    )

    const favorite = favorites.find(f => f.resource_name === app)

    if (!favorite) {
      throw new Error(`${color.app(app)} is not already a favorite app.`)
    }

    await this.heroku.delete(`/favorites/${favorite.id}`, {
      hostname: 'particleboard.heroku.com',
    })

    ux.action.stop()
  }
}
