import color from '@heroku-cli/color'
import {ux} from '@oclif/core'
import {Command, flags} from '@heroku-cli/command'
import {Favorites} from '../../../lib/types/favorites'

export default class Remove extends Command {
  static description = 'unfavorites an app'
  static topic = 'apps'
  static flags  = {
    app: flags.app({required: true}),
  }

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

    try {
      await this.heroku.delete(`/favorites/${favorite.id}`, {
        hostname: 'particleboard.heroku.com',
      })
    } catch (error: any) {
      if (error.statusCode === 404) {
        ux.error('App not found')
      } else {
        ux.error(error.cause)
      }
    }

    ux.action.stop()
  }
}
