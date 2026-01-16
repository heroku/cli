import {color} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'

import {Favorites} from '../../../lib/types/favorites.js'

export default class Add extends Command {
  static description = 'favorites an app'
  static flags  = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  static topic = 'apps'

  async run() {
    const {flags} = await this.parse(Add)
    const {app} = flags

    ux.action.start(`Adding ${color.app(app)} to favorites`)

    const {body: favorites} = await this.heroku.get<Favorites>(
      '/favorites?type=app',
      {hostname: 'particleboard.heroku.com'},
    )

    if (favorites.some(f => f.resource_name === app)) {
      throw new Error(`${color.app(app)} is already a favorite app.`)
    }

    try {
      await this.heroku.post('/favorites', {
        body: {resource_id: app, type: 'app'},
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
