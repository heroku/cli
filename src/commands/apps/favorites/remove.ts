import {Command, flags} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {favoriteExtensions, NotFavoriteError} from '@heroku/sdk/extensions/dashboard-backend'
import {ux} from '@oclif/core/ux'

import {createSDK} from '../../../lib/sdk.js'

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

    const {dashboardBackend} = createSDK(this.heroku, {extensions: [favoriteExtensions]})
    try {
      await dashboardBackend.favorite.removeByAppName(app)
    } catch (error) {
      if (error instanceof NotFavoriteError) {
        // Preserve the legacy error class as well as its message.
        // eslint-disable-next-line unicorn/prefer-type-error -- exact legacy error class is part of CLI compatibility.
        throw new Error(`${color.app(app)} is not already a favorite app.`)
      }

      throw error
    }

    ux.action.stop()
  }
}
