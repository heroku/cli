import color from '@heroku-cli/color'
import {ux} from '@oclif/core'
import {Command, flags} from '@heroku-cli/command'
import {Favorites} from '../../../lib/types/favortites'

export default class Add extends Command {
  static description = 'favorites an app'
  static topic = 'apps'
  static flags  = {
    app: flags.app({required: true}),
  }

  async run() {
    const {flags} = await this.parse(Add)
    const {app} = flags

    ux.action.start(`Adding ${color.app(app)} to favorites`)
    let favorites: Favorites = []

    try {
      const response = await this.heroku.get<Favorites>(
        'https://particleboard.heroku.com/favorites?type=app',
      )
      favorites = response.body
    } catch (error: any) {
      console.log(error)
    }

    if (favorites.find(f => f.resource_name === app)) {
      throw new Error(`${color.app(app)} is already a favorite app.`)
    }

    await this.heroku.post('/favorites', {
      hostname: 'particleboard.heroku.com',
      body: {type: 'app', resource_id: app},
    })

    ux.action.stop()
  }
}

