import {Command, flags} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {
  AlreadyFavoriteError,
  AppNotFoundError,
  FavoriteCreateError,
  favoriteExtensions,
} from '@heroku/sdk/extensions/dashboard-backend'
import {ux} from '@oclif/core/ux'

import {createSDK} from '../../../lib/sdk.js'

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

    const {dashboardBackend} = createSDK(this.heroku, {extensions: [favoriteExtensions]})
    try {
      await dashboardBackend.favorite.addByAppName(app)
    } catch (error: unknown) {
      if (error instanceof AlreadyFavoriteError) {
        // Preserve the legacy error class as well as its message.
        // eslint-disable-next-line unicorn/prefer-type-error -- exact legacy error class is part of CLI compatibility.
        throw new Error(`${color.app(app)} is already a favorite app.`)
      }

      if (error instanceof AppNotFoundError) {
        ux.error('App not found')
      }

      if (error instanceof FavoriteCreateError) {
        const originalError = error.cause as Error
        ux.error(originalError.cause as Error)
      }

      throw error
    }

    ux.action.stop()
  }
}
